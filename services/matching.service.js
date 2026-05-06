// 🔹 Normalize helper
function normalize(row) {
  return {
    utr: String(row?.UTR ?? row?.utr ?? "").trim(),
    amount: Number(row?.Amount ?? row?.amount ?? 0),
    name: String(row?.Name ?? row?.name ?? "")
      .toLowerCase()
      .trim()
  };
}

// 🔹 Name similarity (0 = no match, 0.7 = substring, 1 = exact)
function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.7;
  return 0;
}

function emptyAnalysis(confidence = 0) {
  return {
    utrMatch: false,
    amountMatch: false,
    nameMatch: false,
    confidence
  };
}

function analysisFromPair(pn, bankRow, matchScore) {
  if (!bankRow) return emptyAnalysis(matchScore);
  return {
    utrMatch: Boolean(pn.utr && bankRow.n.utr && pn.utr === bankRow.n.utr),
    amountMatch: pn.amount === bankRow.n.amount,
    nameMatch: nameSimilarity(pn.name, bankRow.n.name) > 0,
    confidence: matchScore
  };
}

export const matchTransactions = (payers, bank) => {
  const bankRows = (bank ?? []).map((b) => ({ raw: b, n: normalize(b) }));
  const payerRows = (payers ?? []).map((p) => ({ raw: p, n: normalize(p) }));

  const bankUtrCounts = {};
  bankRows.forEach((b) => {
    if (b.n.utr) {
      bankUtrCounts[b.n.utr] = (bankUtrCounts[b.n.utr] || 0) + 1;
    }
  });

  const isDuplicateUtrInBank = (utr) => Boolean(utr) && bankUtrCounts[utr] > 1;

  return payerRows.map(({ raw: p, n: pn }) => {
    // 🚨 Priority 1: Suspicious — duplicate UTR in bank file
    if (isDuplicateUtrInBank(pn.utr)) {
      const ref = bankRows.find((b) => b.n.utr === pn.utr) ?? null;
      const matchScore = 0;
      return {
        name: p.name,
        email: p.email,
        utr: p.utr,
        amount: p.amount,
        status: "Suspicious",
        reason: "Duplicate UTR detected",
        matchScore,
        analysis: analysisFromPair(pn, ref, matchScore)
      };
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const b of bankRows) {
      let score = 0;
      if (pn.utr && b.n.utr && pn.utr === b.n.utr) score += 60;
      if (pn.amount === b.n.amount) score += 25;
      score += nameSimilarity(pn.name, b.n.name) * 10;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = b;
      }
    }

    const matchScore = Math.min(100, Math.round(bestScore));

    // Priority 4: No meaningful match
    if (!bestMatch || bestScore === 0) {
      return {
        name: p.name,
        email: p.email,
        utr: p.utr,
        amount: p.amount,
        status: "Not Verified",
        reason: "No matching transaction found",
        matchScore: 0,
        analysis: emptyAnalysis(0)
      };
    }

    const analysis = analysisFromPair(pn, bestMatch, matchScore);

    // Priority 2: Verified (high confidence)
    if (bestScore >= 80) {
      const reason =
        analysis.utrMatch && analysis.amountMatch
          ? "Exact match (UTR + Amount)"
          : "High confidence match";
      return {
        name: p.name,
        email: p.email,
        utr: p.utr,
        amount: p.amount,
        status: "Verified",
        reason,
        matchScore,
        analysis
      };
    }

    // Priority 3: Partial
    if (bestScore >= 50) {
      return {
        name: p.name,
        email: p.email,
        utr: p.utr,
        amount: p.amount,
        status: "Partially Matched",
        reason: "Moderate confidence match",
        matchScore,
        analysis
      };
    }

    return {
      name: p.name,
      email: p.email,
      utr: p.utr,
      amount: p.amount,
      status: "Not Verified",
      reason: "Low confidence match",
      matchScore,
      analysis
    };
  });
};
