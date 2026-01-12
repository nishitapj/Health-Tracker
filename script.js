import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  // ---------------- UI NAV ----------------
  window.showSection = (id) => {
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("records-section").style.display = "none";
    document.getElementById("add-entry").style.display = "none";
    document.getElementById(id).style.display = "block";
  };

  // ---------------- ADD ENTRY ----------------
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
      await addDoc(collection(window.db, "healthData"), {
        date,
        steps,
        water,
        sleep,
        createdAt: new Date()
      });

      alert("✅ Data saved!");

      document.getElementById("date").value = "";
      document.getElementById("steps").value = "";
      document.getElementById("water").value = "";
      document.getElementById("sleep").value = "";

      showSection("dashboard");
      loadEntries();

    } catch (err) {
      console.error("Firestore write error:", err);
      alert("❌ Firestore error — check console");
    }
  });

  // ---------------- LOAD DATA ----------------
  window.loadEntries = async function () {
    try {
      const q = query(
        collection(window.db, "healthData"),
        orderBy("createdAt")
      );

      const snap = await getDocs(q);
      const data = snap.docs.map(d => d.data());

      renderRecords(data);
      renderSummary(data);
      renderCharts(data);

    } catch (err) {
      console.error("Load entries error:", err);
      document.getElementById("records").innerText = "Failed to load records.";
    }
  };

  // ---------------- UI RENDER ----------------
  let stepsChart, waterChart, sleepChart;

  function renderRecords(data) {
    const container = document.getElementById("records");
    container.innerHTML = "";

    if (!data.length) {
      container.innerHTML = "<div class='record'>No records yet.</div>";
      return;
    }

    data.forEach(row => {
      container.insertAdjacentHTML("beforeend", `
        <div class="record">
          <b>Date:</b> ${row.date}<br>
          Steps: ${row.steps}<br>
          Water: ${row.water} L<br>
          Sleep: ${row.sleep} hrs
        </div>
      `);
    });
  }

  function renderSummary(data) {
    const last7 = data.slice(-7);
    const sum = key => last7.reduce((a, b) => a + (Number(b[key]) || 0), 0);

    document.getElementById("week-steps").innerText = sum("steps");
    document.getElementById("week-water").innerText = sum("water") + " L";
    document.getElementById("week-sleep").innerText = sum("sleep") + " hrs";
  }

  function renderCharts(data) {
    const dates = data.map(d => d.date);
    const steps = data.map(d => d.steps);
    const water = data.map(d => d.water);
    const sleep = data.map(d => d.sleep);

    if (stepsChart) stepsChart.destroy();
    if (waterChart) waterChart.destroy();
    if (sleepChart) sleepChart.destroy();

    stepsChart = new Chart(document.getElementById("stepsChart"), {
      type: "line",
      data: { labels: dates, datasets: [{ label: "Steps", data: steps }] }
    });

    waterChart = new Chart(document.getElementById("waterChart"), {
      type: "line",
      data: { labels: dates, datasets: [{ label: "Water (L)", data: water }] }
    });

    sleepChart = new Chart(document.getElementById("sleepChart"), {
      type: "line",
      data: { labels: dates, datasets: [{ label: "Sleep (hrs)", data: sleep }] }
    });
  }

  // ---------------- START APP ----------------
  showSection("dashboard");
  loadEntries();

});
