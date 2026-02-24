(function () {
  function animateAtsScore(scoreValue) {
    const circle = document.getElementById('score-circle-fill');
    if (!circle) return;

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (scoreValue / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  window.animateAtsScore = animateAtsScore;
})();
