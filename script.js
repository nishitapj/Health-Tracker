// script.js
document.addEventListener("DOMContentLoaded", () => {
  // UI helpers
  window.showSection = (id) => {
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("add-entry").style.display = "none";
    document.getElementById(id).style.display = "block";
  };

  document.getElementById("btnAdd").addEventListener("click", async () => {
    const date = document.getElementById("date").value;
    const steps = Number(document.getElementById("steps").value);
    const water = Number(document.getElementById("water").value);
    const sleep = Number(document.getElementById("sleep").value);

    if (!date || !steps || !water || !sleep) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const { collection, addDoc, getDocs, query, orderBy } =
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

      const colRef = collection(window.db, "healthData");

      await addDoc(colRef, {
        date,
        steps,
        water,
        sleep,
        createdAt: new Date()
      });

      // success
      document.getElementById("date").value = "";
      document.getElementById("steps").value = "";
      document.getElementById("water").value = "";
      document.getElementById("sleep").value = "";
      showSection("dashboard");
      await loadEntries();
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  });

  // charts variables
  let stepsChart, waterChart, sleepChart;

  window.loadEntries = async function () {
    try {
      const { collection, getDocs, query, orderBy } =
        await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

      const q = query(collection(window.db, "healthData"), orderBy("createdAt"));
      const snap = await getDocs(q);

      const data = snap.docs.map(d => d.data());

      renderRecords(data);
      renderSummary(data);
      renderCharts(data);
      generateSuggestions(data);
    } catch (err) {
      console.error("Load entries error", err);
      document.getElementById("records").innerText = "Failed to load records.";
    }
  };

  function renderRecords(data) {
    const container = document.getElementById("records");
    container.innerHTML = "";
    if (!data || data.length === 0) {
      container.innerHTML = "<div class='record'>No records yet. Add a new entry.</div>";
      return;
    }
    data.forEach(row => {
      const html = `<div class="record">
        <b>Date:</b> ${row.date} <br>
        Steps: ${row.steps} <br>
        Water: ${row.water} L <br>
        Sleep: ${row.sleep} hrs
      </div>`;
      container.insertAdjacentHTML("beforeend", html);
    });
  }

  function renderSummary(data) {
    const last7 = data.slice(-7);
    const sum = (key) => last7.reduce((a, b) => a + (Number(b[key]) || 0), 0);
    document.getElementById("week-steps").innerText = sum("steps");
    document.getElementById("week-water").innerText = sum("water") + " L";
    document.getElementById("week-sleep").innerText = sum("sleep") + " hrs";
  }

  function renderCharts(data) {
    const dates = data.map(d => d.date);
    const steps = data.map(d => d.steps);
    const water = data.map(d => d.water);
    const sleep = data.map(d => d.sleep);

    // destroy previous
    if (stepsChart) stepsChart.destroy();
    if (waterChart) waterChart.destroy();
    if (sleepChart) sleepChart.destroy();

    const ctx1 = document.getElementById("stepsChart").getContext("2d");
    const ctx2 = document.getElementById("waterChart").getContext("2d");
    const ctx3 = document.getElementById("sleepChart").getContext("2d");

    stepsChart = new Chart(ctx1, { type: "line", data: { labels: dates, datasets: [{ label: "Steps", data: steps, fill: false }] } });
    waterChart = new Chart(ctx2, { type: "line", data: { labels: dates, datasets: [{ label: "Water (L)", data: water, fill: false }] } });
    sleepChart = new Chart(ctx3, { type: "line", data: { labels: dates, datasets: [{ label: "Sleep (hrs)", data: sleep, fill: false }] } });
  }

  function generateSuggestions(data) {
    const out = document.getElementById("suggestions");
    if (!data || data.length === 0) {
      out.innerHTML = "No data yet — add entries to get suggestions.";
      return;
    }
    const last7 = data.slice(-7);
    const avg = key => last7.reduce((a, b) => a + (Number(b[key]) || 0), 0) / last7.length;
    const avgSteps = avg("steps"), avgWater = avg("water"), avgSleep = avg("sleep");

    let s = "";
    if (avgSteps < 5000) s += "<strong>🚶 Steps:</strong> Walk more — target 6k–8k steps/day.<br><br>";
    else if (avgSteps < 8000) s += "<strong>🚶 Steps:</strong> Good — try to reach 8k for extra benefit.<br><br>";
    else s += "<strong>🚶 Steps:</strong> Excellent! Keep it up.<br><br>";

    if (avgWater < 2) s += "<strong>💧 Water:</strong> Increase to 2–3 L/day.<br><br>";
    else if (avgWater < 3) s += "<strong>💧 Water:</strong> Good hydration.<br><br>";
    else s += "<strong>💧 Water:</strong> Excellent hydration.<br><br>";

    if (avgSleep < 6) s += "<strong>😴 Sleep:</strong> Try to get 7–8 hours/night.<br><br>";
    else if (avgSleep < 8) s += "<strong>😴 Sleep:</strong> Healthy sleep pattern.<br><br>";
    else s += "<strong>😴 Sleep:</strong> Great sleep quality.<br><br>";

    out.innerHTML = s;
  }

  // start
  showSection("dashboard");
  loadEntries();
});
