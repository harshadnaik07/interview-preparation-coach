function evaluateAnswer(answer, keywords) {
  const text = (answer || "").trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const hits = keywords.filter((k) => text.includes(k)).length;
  const length = Math.min(30, Math.round(words.length / 2));
  const structure =
    /because|first|then|finally|for example|result|situation|action/i.test(text)
      ? 20
      : 0;
  const relevance = Math.min(45, hits * 12);
  const score = Math.min(100, Math.max(0, length + structure + relevance));
  const feedback =
    score >= 78
      ? "Strong answer — clear, relevant, and supported with useful detail."
      : score >= 50
        ? "Good foundation — add a specific example and make the result clearer."
        : "Keep practicing — use a simple structure, explain your thinking, and include an example.";
  return { score, feedback, words: words.length, hits };
}
window.evaluateAnswer = evaluateAnswer;
