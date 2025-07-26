let lastAction = null;

setInterval(() => {
  fetch("/api/control")
    .then(res => res.json())
    .then(command => {
      // Listen for Live Ranking 2 actions from controller
      if (command.action !== lastAction) {
        if (command.action === "hide2") {
          animateColumns("hide");
        } else if (command.action === "show2") {
          animateColumns("show");
        }
        lastAction = command.action;
      }
    });
}, 1000);

function animateColumns(direction) {
  const header = document.querySelector('.rankingHeader');
  const rows = Array.from(document.querySelectorAll('.rankingElement'));
  const lower = document.querySelector('.lowerHeader');
  const all = [header, ...rows, lower].filter(Boolean);
  const mainDiv = document.getElementById("mainDiv");

  // For "show", hide all before animating in
  if (direction === "show") {
    all.forEach(el => {
      el.style.opacity = 0;
      el.style.visibility = "hidden";
    });
    mainDiv.style.height = "";
    mainDiv.style.overflow = "";
  }

  // For "hide", reverse the order so animation starts from bottom to top
  const animateOrder = direction === "hide" ? [...all].reverse() : all;

  animateOrder.forEach((el, i) => {
    el.classList.remove('slide-left', 'slide-right');
    el.style.animationDelay = "0ms";

    setTimeout(() => {
      if (direction === "show") {
        el.style.visibility = "visible";
        el.classList.add('slide-left');
        el.addEventListener('animationend', function handler() {
          el.classList.remove('slide-left');
          el.style.opacity = 1;
          el.style.animationDelay = "0ms";
          el.removeEventListener('animationend', handler);
        });
      } else {
        el.style.visibility = "visible";
        el.classList.add('slide-right');
        el.addEventListener('animationend', function handler() {
          el.classList.remove('slide-right');
          el.style.opacity = 0;
          el.style.visibility = "hidden";
          el.style.animationDelay = "0ms";
          el.removeEventListener('animationend', handler);
          // Hide mainDiv after last element
          if (i === animateOrder.length - 1) {
            mainDiv.style.height = "0";
            mainDiv.style.overflow = "hidden";
          }
        });
      }
    }, i * 80); // 80ms stagger, adjust as needed
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const mainDiv = document.getElementById("mainDiv");
  mainDiv.style.display = "flex";

  createRankingElements(19);
  fetchRankingData();
  setInterval(fetchRankingData, 1000);
});

const sheetID = "1srwCRcCf_grbInfDSURVzXXRqIqxQ6_IIPG-4_gnSY8";
const sheetName = "LIVE";
const query = "select I, J, L, M, N, K";
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&tq=${encodeURIComponent(query)}`;

let previousRanks = {};

function createRankingElements(count = 19) {
  const wrapper = document.getElementById("rankingElementsWrapper");
  wrapper.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const div = document.createElement("div");
    div.className = "rankingElement";
    div.setAttribute("data-position", i);
    div.innerHTML = `
      <div class="rankingElementBackground"></div>
      <div class="rankingElementWrapper">
        <p class="rankingElementRank"></p>
        <div class="rankingElementLogoWrapper">
          <div class="rankingElementNoLogo"></div>
          <img class="rankingElementLogo" src="logo.png" alt="Logo" />
          <p class="rankingElementName"></p>
        </div>
        <div class="rankingElementAliveWrapper">
          <div class="rankingElementAlive"></div>
          <div class="rankingElementAlive"></div>
          <div class="rankingElementAlive"></div>
          <div class="rankingElementAlive"></div>
        </div>
        <p class="rankingElementPts"></p> <!-- Added line -->
        <p class="rankingElementKills"></p>
      </div>
    `;
    wrapper.appendChild(div);
  }
}

async function fetchRankingData() {
  try {
    const response = await fetch(sheetURL);
    const text = await response.text();
    const jsonText = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
    if (!jsonText) throw new Error("Invalid JSON format");

    const jsonData = JSON.parse(jsonText[1]);
    const rows = jsonData.table.rows.map(row => ({
      rank: row.c[0]?.v ?? "#",
      team: row.c[1]?.v?.toString().trim() ?? "Unknown",
      elims: row.c[2]?.v ?? 0,
      logo: row.c[3]?.v ?? "https://placehold.co/22x22/000000/FFF?text=?",
      alive: row.c[4]?.v ?? 0,
      pts: row.c[5]?.v ?? 0 // Add this line (adjust index if needed)
    }));

    updateRankingElements(rows);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

function updateRankingElements(data) {
  const newRanks = {};

  data.forEach((team, index) => {
    newRanks[team.team] = index;
  });

  data.forEach((teamData, index) => {
    const element = document.querySelector(`.rankingElement[data-position="${index + 1}"]`);
    if (!element) return;

    const prevIndex = previousRanks[teamData.team];

    if (prevIndex !== undefined && index < prevIndex) {
      element.classList.add("slide-up");
      element.addEventListener("animationend", () => {
        element.classList.remove("slide-up");
      }, { once: true });
    }

    element.querySelector(".rankingElementRank").textContent = `#${teamData.rank}`;
    element.querySelector(".rankingElementName").textContent = teamData.team;
    element.querySelector(".rankingElementLogo").src = teamData.logo;
    element.querySelector(".rankingElementKills").textContent = teamData.elims;
    element.querySelector(".rankingElementPts").textContent = teamData.pts ?? ""; // Add this line

    const aliveBoxes = element.querySelectorAll(".rankingElementAlive");
    aliveBoxes.forEach((box, i) => {
      box.style.backgroundColor = i < teamData.alive ? "#ffffff" : "#0e0d0d";
    });

    if (teamData.alive === 0) {
      element.classList.add("fadedTeam");
    } else {
      element.classList.remove("fadedTeam");
    }
  });

  previousRanks = { ...newRanks };
}

function send(action) {
  fetch('/api/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  }).then(res => res.json())
    .then(data => console.log(data))
    .catch(console.error);
}
