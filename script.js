// Inisialisasi variabel dan state aplikasi
let currentQueue = "A001";
let currentOperator = "Operator 1";
let queueHistory = [];
let queueCounter = 0;
let operators = [
    { id: 1, name: "Operator 1", status: "available", description: "Pendaftaran" },
    { id: 2, name: "Operator 2", status: "available", description: "Verifikasi Dokumen" },
    { id: 3, name: "Operator 3", status: "available", description: "Wawancara" },
    { id: 4, name: "Operator 4", status: "available", description: "Tes Tertulis" },
    { id: 5, name: "Operator 5", status: "available", description: "Konseling" },
    { id: 6, name: "Operator 6", status: "available", description: "Pembayaran" },
    { id: 7, name: "Operator 7", status: "available", description: "Pengambilan Kartu" },
    { id: 8, name: "Operator 8", status: "available", description: "Informasi" }
];

// Inisialisasi Web Speech API
let speechSynthesis = window.speechSynthesis;
let isSpeaking = false;

// DOM Elements
const currentQueueElement = document.getElementById('current-queue');
const currentOperatorElement = document.getElementById('current-operator');
const nextQueueElement = document.getElementById('next-queue');
const nextOperatorElement = document.getElementById('next-operator');
const statusTextElement = document.getElementById('status-text');
const historyListElement = document.getElementById('history-list');
const queueNumberInput = document.getElementById('queue-number');
const operatorSelect = document.getElementById('operator-select');
const callButton = document.getElementById('call-button');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const resetButton = document.getElementById('reset-btn');
const queueCounterElement = document.getElementById('queue-counter');
const currentDateElement = document.getElementById('current-date');
const currentTimeElement = document.getElementById('current-time');
const operatorGridElement = document.querySelector('.operator-grid');
const notificationSound = document.getElementById('notification-sound');

// Fungsi untuk mengupdate waktu dan tanggal
function updateDateTime() {
    const now = new Date();
    
    // Format tanggal: Hari, Tanggal Bulan Tahun
    const optionsDate = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const formattedDate = now.toLocaleDateString('id-ID', optionsDate);
    currentDateElement.textContent = formattedDate;
    
    // Format waktu: HH:MM:SS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Fungsi untuk menginisialisasi operator grid
function initializeOperatorGrid() {
    operatorGridElement.innerHTML = '';
    
    operators.forEach(operator => {
        const operatorCard = document.createElement('div');
        operatorCard.className = `operator-card ${operator.status}`;
        
        operatorCard.innerHTML = `
            <i class="fas fa-user-tie"></i>
            <h4>${operator.name}</h4>
            <p>${operator.description}</p>
            <div class="status ${operator.status}">${operator.status === 'available' ? 'Tersedia' : 'Sedang Melayani'}</div>
        `;
        
        operatorGridElement.appendChild(operatorCard);
    });
}

// Fungsi untuk mengupdate status operator
function updateOperatorStatus(operatorName, status) {
    const operatorIndex = operators.findIndex(op => op.name === operatorName);
    
    if (operatorIndex !== -1) {
        operators[operatorIndex].status = status;
        initializeOperatorGrid();
    }
}

// Fungsi untuk menghasilkan nomor antrian berikutnya
function getNextQueueNumber(currentNumber) {
    // Mengambil huruf dan angka dari nomor antrian
    const match = currentNumber.match(/^([A-Za-z]+)(\d+)$/);
    
    if (match) {
        const prefix = match[1];
        const number = parseInt(match[2]);
        const nextNumber = number + 1;
        
        // Format angka dengan leading zeros
        const formattedNumber = String(nextNumber).padStart(match[2].length, '0');
        return prefix + formattedNumber;
    }
    
    // Fallback jika format tidak sesuai
    return "A002";
}

// Fungsi untuk memanggil antrian dengan suara
function callQueue() {
    const queueNumber = queueNumberInput.value.trim();
    const selectedOperator = operatorSelect.value;
    
    // Validasi input
    if (!queueNumber) {
        alert("Harap masukkan nomor antrian!");
        queueNumberInput.focus();
        return;
    }
    
    // Update antrian saat ini
    currentQueue = queueNumber;
    currentOperator = selectedOperator;
    
    // Update tampilan
    currentQueueElement.textContent = currentQueue;
    currentOperatorElement.textContent = currentOperator;
    
    // Generate antrian berikutnya
    const nextQueueNumber = getNextQueueNumber(queueNumber);
    nextQueueElement.textContent = nextQueueNumber;
    nextOperatorElement.textContent = "Menunggu";
    
    // Update status
    statusTextElement.innerHTML = `<i class="fas fa-bullhorn"></i> Memanggil antrian <strong>${queueNumber}</strong> ke <strong>${selectedOperator}</strong>`;
    statusTextElement.style.color = "#e74c3c";
    
    // Update operator status menjadi "busy"
    updateOperatorStatus(selectedOperator, "busy");
    
    // Tambahkan ke riwayat
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const historyItem = {
        queue: queueNumber,
        operator: selectedOperator,
        time: timeString
    };
    
    queueHistory.unshift(historyItem);
    updateHistoryList();
    
    // Update counter
    queueCounter++;
    queueCounterElement.textContent = `Total Antrian Dipanggil: ${queueCounter}`;
    
    // Putar suara notifikasi
    notificationSound.currentTime = 0;
    notificationSound.play().catch(e => console.log("Autoplay diblokir:", e));
    
    // Panggil antrian dengan suara
    speakQueueCall(queueNumber, selectedOperator);
    
    // Set timeout untuk mengembalikan operator ke status tersedia setelah 3 menit
    setTimeout(() => {
        updateOperatorStatus(selectedOperator, "available");
    }, 180000); // 3 menit
}

// Fungsi untuk membacakan panggilan antrian
function speakQueueCall(queueNumber, operator) {
    if (isSpeaking) {
        speechSynthesis.cancel();
    }
    
    // Teks yang akan diucapkan
    const text = `Nomor antrian ${queueNumber.split('').join(' ')} silahkan menuju ${operator}`;
    
    // Buat utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.9; // Kecepatan bicara
    utterance.pitch = 1.2; // Tinggi nada (lebih tinggi untuk suara wanita)
    utterance.volume = 1;
    
    // Event ketika selesai berbicara
    utterance.onend = function() {
        isSpeaking = false;
        // Reset status text setelah 10 detik
        setTimeout(() => {
            statusTextElement.innerHTML = `<i class="fas fa-info-circle"></i> Silahkan menunggu panggilan antrian`;
            statusTextElement.style.color = "";
        }, 10000);
    };
    
    // Mulai berbicara
    speechSynthesis.speak(utterance);
    isSpeaking = true;
}

// Fungsi untuk mengupdate daftar riwayat
function updateHistoryList() {
    historyListElement.innerHTML = '';
    
    // Batasi riwayat hingga 10 item terakhir
    const recentHistory = queueHistory.slice(0, 10);
    
    recentHistory.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span><strong>${item.queue}</strong> → ${item.operator}</span>
            <span>${item.time}</span>
        `;
        historyListElement.appendChild(listItem);
    });
}

// Fungsi untuk menampilkan antrian sebelumnya
function showPreviousQueue() {
    if (queueHistory.length > 0) {
        const previousItem = queueHistory[0]; // Item terbaru
        queueNumberInput.value = previousItem.queue;
        operatorSelect.value = previousItem.operator;
    }
}

// Fungsi untuk menampilkan antrian berikutnya
function showNextQueue() {
    const currentNumber = queueNumberInput.value.trim();
    const nextNumber = getNextQueueNumber(currentNumber);
    queueNumberInput.value = nextNumber;
}

// Fungsi untuk mereset antrian
function resetQueue() {
    if (confirm("Apakah Anda yakin ingin mereset antrian? Riwayat panggilan akan dihapus.")) {
        // Reset antrian saat ini
        currentQueue = "A001";
        currentOperator = "Operator 1";
        
        // Update tampilan
        currentQueueElement.textContent = currentQueue;
        currentOperatorElement.textContent = currentOperator;
        nextQueueElement.textContent = "A002";
        nextOperatorElement.textContent = "Operator 2";
        
        // Reset input
        queueNumberInput.value = "A001";
        operatorSelect.value = "Operator 1";
        
        // Reset status
        statusTextElement.innerHTML = `<i class="fas fa-info-circle"></i> Silahkan menunggu panggilan antrian`;
        statusTextElement.style.color = "";
        
        // Reset riwayat
        queueHistory = [];
        updateHistoryList();
        
        // Reset counter
        queueCounter = 0;
        queueCounterElement.textContent = `Total Antrian Dipanggil: ${queueCounter}`;
        
        // Reset semua operator ke status tersedia
        operators.forEach(operator => {
            operator.status = "available";
        });
        initializeOperatorGrid();
        
        alert("Antrian berhasil direset!");
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi tampilan
    updateDateTime();
    initializeOperatorGrid();
    
    // Update waktu setiap detik
    setInterval(updateDateTime, 1000);
    
    // Event listener untuk tombol panggil
    callButton.addEventListener('click', callQueue);
    
    // Event listener untuk tombol sebelumnya
    prevButton.addEventListener('click', showPreviousQueue);
    
    // Event listener untuk tombol berikutnya
    nextButton.addEventListener('click', showNextQueue);
    
    // Event listener untuk tombol reset
    resetButton.addEventListener('click', resetQueue);
    
    // Event listener untuk input nomor antrian (Enter untuk panggil)
    queueNumberInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            callQueue();
        }
    });
    
    // Event listener untuk memastikan format nomor antrian benar
    queueNumberInput.addEventListener('blur', function() {
        const value = this.value.trim();
        // Validasi format: huruf diikuti angka
        if (!/^[A-Za-z]+\d+$/.test(value)) {
            alert("Format nomor antrian tidak valid. Contoh: A001, B123");
            this.value = currentQueue;
            this.focus();
        }
    });
    
    // Update antrian berikutnya ketika nomor antrian diubah
    queueNumberInput.addEventListener('input', function() {
        const nextNumber = getNextQueueNumber(this.value);
        nextQueueElement.textContent = nextNumber;
    });
    
    // Update antrian berikutnya ketika operator diubah
    operatorSelect.addEventListener('change', function() {
        nextOperatorElement.textContent = this.value;
    });
    
    // Inisialisasi antrian berikutnya
    nextQueueElement.textContent = getNextQueueNumber(queueNumberInput.value);
    nextOperatorElement.textContent = operatorSelect.value;
    
    // Set focus ke input nomor antrian
    queueNumberInput.focus();
    
    // Menampilkan pesan selamat datang
    console.log("Sistem Antrian SPMB SMA Negeri 1 Magetan siap digunakan!");
});