const crypto = require("crypto");
const Invite = require("../models/Invite");
const Group = require("../models/Group");

const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const normalizeGroupMembers = (group) => {
  if (!group || !Array.isArray(group.members)) {
    return false;
  }

  const seen = new Set();
  const normalizedMembers = [];

  for (const member of group.members) {
    const memberId = member?.user?._id ? member.user._id.toString() : member?.user?.toString?.();

    if (!memberId || seen.has(memberId)) {
      continue;
    }

    seen.add(memberId);
    normalizedMembers.push(member);
  }

  const changed = normalizedMembers.length !== group.members.length;
  if (changed) {
    group.members = normalizedMembers;
  }

  return changed;
};

const createInvite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { id } = req.params;
    const { email, expiresHours, maxUses } = req.body;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Only existing group members can create invites
    const isMember = group.members.some((m) => m.user && m.user.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(401).json({ message: "Not authorized to invite members to this group" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const inviteLimit = Math.min(Math.max(Number(maxUses) || 1, 1), 100);
    const expiresInMs = (Number(expiresHours) || 72) * 60 * 60 * 1000; // default 72 hours
    const expiresAt = new Date(Date.now() + expiresInMs);

    const invite = await Invite.create({
      group: id,
      inviter: req.user._id,
      tokenHash,
      email: email ? email.toLowerCase().trim() : null,
      expiresAt,
      maxUses: inviteLimit,
    });

    const baseUrl = process.env.CLIENT_URL || req.headers.origin || "http://localhost:5200";
    const inviteUrl = `${baseUrl}/invite/${token}`;

    // If SMTP configured, attempt to email the invite link
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        if (email) {
          const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
          await transporter.sendMail({
            from,
            to: email,
            subject: `You're invited to join ${baseUrl}`,
            text: `Join the group using this link: ${inviteUrl}`,
            html: `<p>Join the group using this link: <a href=\"${inviteUrl}\">Accept Invite</a></p>`,
          });
        }
      } catch (mailErr) {
        console.warn('Failed to send invite email:', mailErr.message || mailErr);
      }
    }

    res.status(201).json({ url: inviteUrl, expiresAt: invite.expiresAt, maxUses: invite.maxUses });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Authentication required to accept invite" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await Invite.findOne({ tokenHash });

    if (!invite) {
      return res.status(404).json({ message: "Invalid or expired invite" });
    }

    if (invite.used || invite.usesCount >= invite.maxUses) {
      return res.status(400).json({ message: "Invite already used" });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invite has expired" });
    }

    // Add user to group if not already
    const group = await Group.findById(invite.group);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const already = group.members.some((m) => m.user && m.user.toString() === req.user._id.toString());

    if (!already) {
      group.members.push({ user: req.user._id });
    }

    // Record user in acceptedBy if not already recorded
    const alreadyAccepted = (invite.acceptedBy || []).some((a) => a.user && a.user.toString() === req.user._id.toString());
    if (!alreadyAccepted) {
      if (!invite.acceptedBy) invite.acceptedBy = [];
      invite.acceptedBy.push({ user: req.user._id });
      invite.usesCount = Math.min((invite.usesCount || 0) + 1, invite.maxUses);
      invite.used = invite.usesCount >= invite.maxUses;
    }

    normalizeGroupMembers(group);
    await group.save();

    await invite.save();

    const populated = await Group.findById(group._id).populate("members.user", "name email");

    res.json({ group: populated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const listInvites = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);

    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m.user && m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(401).json({ message: 'Not authorized' });

    const invites = await Invite.find({ group: id })
      .populate('inviter', 'name email')
      .populate('acceptedBy.user', 'name email')
      .sort({ createdAt: -1 });

    // Do not return tokenHash
    const out = invites.map((i) => ({
      _id: i._id,
      email: i.email,
      expiresAt: i.expiresAt,
      used: i.used,
      usesCount: i.usesCount || 0,
      maxUses: i.maxUses || 1,
      createdAt: i.createdAt,
      inviter: i.inviter,
      acceptedBy: (i.acceptedBy || []).map((a) => ({
        user: a.user,
        acceptedAt: a.acceptedAt,
      })),
    }));

    res.json(out);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const revokeInvite = async (req, res) => {
  try {
    const { id, inviteId } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const isMember = group.members.some((m) => m.user && m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(401).json({ message: 'Not authorized' });

    const invite = await Invite.findOne({ _id: inviteId, group: id });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    invite.used = true;
    await invite.save();

    res.json({ message: 'Invite revoked' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createInvite,
  acceptInvite,
  listInvites,
  revokeInvite,
};
