import { parseExcel } from "../services/parser.service.js";
import { matchTransactions } from "../services/matching.service.js";
import Transaction from "../models/transaction.model.js";
import Event from "../models/event.model.js";
import { sendEmail } from "../services/email.service.js";

export const handleUpload = async (req, res) => {
  const { eventId } = req.body;

  const payerFile = req.files.payer[0].path;
  const bankFile = req.files.bank[0].path;

  const userId = req.user?._id;

  await Event.findOneAndUpdate(
    { _id: eventId, user: userId },
    { status: "processing" },
    { new: true }
  );

  res.json({ count: 0, data: [] });

  setTimeout(async () => {
    console.log("Processing started");
    try {
      const payers = parseExcel(payerFile);
      const bank = parseExcel(bankFile);

      const results = matchTransactions(payers, bank);
      console.log("Matching completed");

      const data = results.map((r) => ({
        ...r,
        user: userId,
        event: eventId
      }));

      await Transaction.insertMany(data);

      await Event.findOneAndUpdate(
        { _id: eventId, user: userId },
        { status: "completed" }
      );

      console.log("Event completed");

      // Email failures should NOT fail the job
      try {
        for (const txn of results) {
          const to = txn?.email;
          if (!to) {
            console.log("Email skipped (missing txn.email)");
            continue;
          }

          let subject = "Payment verification update";
          let message = "Payment verification update.";

          switch (txn.status) {
            case "Verified":
              subject = "Payment Verified";
              message = "Your payment has been successfully verified.";
              break;
            case "Partially Matched":
              subject = "Payment Needs Verification";
              message =
                "Your payment requires manual verification because some transaction details did not fully match.";
              break;
            case "Not Verified":
              subject = "Payment Verification Failed";
              message =
                "We could not find a matching payment transaction. Please contact support.";
              break;
            case "Suspicious":
              subject = "Suspicious Transaction Detected";
              message =
                "Your transaction has been flagged for duplicate or suspicious activity.";
              break;
            default:
              break;
          }

          try {
            const ok = await sendEmail(req.user, to, subject, message);
            if (ok) console.log(`Email sent to: ${to}`);
            else console.log(`Email failed for: ${to}`);
          } catch (singleEmailErr) {
            console.log(`Email failed for: ${to}`);
            console.log("Email error:", singleEmailErr?.message ?? singleEmailErr);
          }
        }

        console.log("Emails sent");
      } catch (emailErr) {
        console.log("Email error:", emailErr?.message ?? emailErr);
      }
    } catch (err) {
      await Event.findOneAndUpdate(
        { _id: eventId, user: userId },
        { status: "failed" }
      );
      // Intentionally swallow: async background task
      console.error(err);
    }
  }, 0);
};

export const getEventTransactions = async (req, res) => {
  const data = await Transaction.find({
    event: req.params.eventId
  });

  res.json(data);
};