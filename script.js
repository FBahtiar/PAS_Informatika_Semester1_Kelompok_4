document.addEventListener("DOMContentLoaded", loadHistory);

/* ============================================================
                        PREDIKSI TANAMAN
============================================================ */
function predict() {
    let t = parseFloat(document.getElementById("tinggi_awal").value);
    let h = parseFloat(document.getElementById("curah_hujan").value);
    let k = parseFloat(document.getElementById("kelembapan").value);
    let p = parseFloat(document.getElementById("pupuk").value);
    let d = parseInt(document.getElementById("hari").value);

    if (isNaN(t) || isNaN(h) || isNaN(k) || isNaN(p) || isNaN(d)) {
        alert("Harap isi semua data!");
        return;
    }

    let hasil = t + (h * 0.01) + (k * 0.02) + (p * 0.05) + (d * 0.1);

    document.getElementById("result").innerHTML =
        "Prediksi Tinggi Akhir: <b>" + hasil.toFixed(2) + " cm</b>";

    saveHistory({ t, h, k, p, d, hasil });
}

/* ============================================================
                        INDEXED DB
============================================================ */
let db;
let request = indexedDB.open("plantPredictionDB", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    db.createObjectStore("history", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;
    loadHistory();
};

function saveHistory(data) {
    let tx = db.transaction("history", "readwrite");
    tx.objectStore("history").add(data);
    tx.oncomplete = loadHistory;
}

function loadHistory() {
    if (!db) return;

    let tx = db.transaction("history", "readonly");
    let store = tx.objectStore("history");

    let rows = "";

    store.openCursor().onsuccess = function (event) {
        let cursor = event.target.result;

        if (cursor) {
            let d = cursor.value;
            rows += `
                <tr>
                    <td>${d.t}</td>
                    <td>${d.h}</td>
                    <td>${d.k}</td>
                    <td>${d.p}</td>
                    <td>${d.d}</td>
                    <td>${d.hasil.toFixed(2)}</td>
                    <td><span class="action-btn" onclick="deleteItem(${cursor.key})">Hapus</span></td>
                </tr>`;
            cursor.continue();
        }

        document.querySelector("#historyTable tbody").innerHTML = rows;
    };
}

function deleteItem(id) {
    let tx = db.transaction("history", "readwrite");
    tx.objectStore("history").delete(id);
    tx.oncomplete = loadHistory;
}

function clearHistory() {
    let tx = db.transaction("history", "readwrite");
    tx.objectStore("history").clear();
    tx.oncomplete = loadHistory;
}

/* ============================================================
                        CUACA MALANG (5-HARI)
============================================================ */
function getWeather() {

    let city = "Malang"; // otomatis kota Malang
    let apiKey = "4b70947c6f1d4539b4e73703251311";

    // Ramalan 6 hari = hari ini + 5 hari ke depan
    let url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=6&aqi=no&alerts=no`;

    document.getElementById("weatherResult").innerHTML =
        "<p>Sedang mengambil data cuaca Kota Malang...</p>";

    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data.forecast) {
                document.getElementById("weatherResult").innerHTML = "Data tidak ditemukan!";
                return;
            }

            let html = `
                <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:15px;">
            `;

            data.forecast.forecastday.forEach(day => {
                html += `
                    <div class="day-card" 
                        style="width:140px; padding:12px; border-radius:12px; 
                               background:#ffffffd9; text-align:center;">
                        <h3>${day.date}</h3>
                        <img src="${day.day.condition.icon}">
                        <p><b>${day.day.avgtemp_c}°C</b></p>
                        <p>${day.day.condition.text}</p>
                    </div>
                `;
            });

            html += "</div>";

            document.getElementById("weatherResult").innerHTML = html;
        })
        .catch(() => {
            document.getElementById("weatherResult").innerHTML =
                "Gagal mengambil data cuaca.";
        });
}
