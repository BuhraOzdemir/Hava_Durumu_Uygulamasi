const apiKey = '7c73070159079fc164b5e6aa800e9e23'; // Kendi OpenWeatherMap API anahtarınızı kullanın
let currentLanguage = localStorage.getItem('weatherAppLanguage') || 'tr';
let currentCity = ''; // Son aranan şehri saklamak için

// DOM Elementleri
const citySelect = document.getElementById("citySelect");
const cityInput = document.getElementById("cityInput");
const languageSelect = document.getElementById("languageSelect");
const modeButton = document.getElementById("modeButton");
const getWeatherButton = document.getElementById("getWeatherButton");
const weatherResultDiv = document.getElementById("weatherResult");
const htmlEl = document.documentElement; // HTML elementine erişim (lang attribute'u için)

// Çeviriler
const translations = {
    tr: {
        selectCity: "Şehir Seçin",
        enterCity: "Şehir girin veya seçin",
        getWeather: "Hava Durumunu Getir",
        loading: "Yükleniyor...",
        cityNotFound: "Şehir bulunamadı veya API hatası.",
        errorOccurred: "Bir hata oluştu. Lütfen tekrar deneyin.",
        temperature: "Sıcaklık",
        weather: "Hava Durumu",
        feelsLike: "Hissedilen Sıcaklık",
        humidity: "Nem",
        windSpeed: "Rüzgar Hızı",
        darkMode: "Karanlık Mod",
        lightMode: "Aydınlık Mod",
        selectCityAlert: "Lütfen bir şehir adı girin veya seçin!",
        pressure: "Basınç"
    },
    en: {
        selectCity: "Select City",
        enterCity: "Enter or select a city",
        getWeather: "Get Weather",
        loading: "Loading...",
        cityNotFound: "City not found or API error.",
        errorOccurred: "An error occurred. Please try again.",
        temperature: "Temperature",
        weather: "Weather",
        feelsLike: "Feels Like",
        humidity: "Humidity",
        windSpeed: "Wind Speed",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        selectCityAlert: "Please enter or select a city name!",
        pressure: "Pressure"
    }
};

function updateUIText() {
    const t = translations[currentLanguage];
    document.title = currentLanguage === 'tr' ? "Hava Durumu Uygulaması" : "Weather App";
    htmlEl.setAttribute('lang', currentLanguage); // Sayfanın dilini güncelle

    citySelect.options[0].textContent = t.selectCity;
    cityInput.placeholder = t.enterCity;
    getWeatherButton.textContent = t.getWeather;
    
    // Mod butonu metnini de güncelle
    const isDarkMode = document.body.classList.contains('dark-mode');
    modeButton.textContent = isDarkMode ? '☀️' : '🌙'; // Veya t.lightMode / t.darkMode
    modeButton.setAttribute('aria-label', isDarkMode ? t.lightMode : t.darkMode);
}

function applyInitialPreferences() {
    // Dil tercihini uygula
    languageSelect.value = currentLanguage;
    updateUIText();

    // Tema tercihini uygula
    const savedMode = localStorage.getItem('weatherAppMode');
    if (savedMode === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateUIText(); // Mod butonu ikonunu/metnini doğru ayarlamak için tekrar çağır
    
    // Varsayılan olarak İstanbul hava durumunu getir
    const defaultCity = "İstanbul";
    cityInput.value = defaultCity; // Input'a da yazalım
    // citySelect.value = defaultCity; // Eğer dropdown'da varsa seçili de yapabiliriz
    getWeather(defaultCity);
}

function displayLoading() {
    weatherResultDiv.innerHTML = `<p>${translations[currentLanguage].loading}</p>`;
    weatherResultDiv.classList.add("active");
}

function displayError(message) {
    weatherResultDiv.innerHTML = `<p style="color:red;">${message}</p>`;
    weatherResultDiv.classList.add("active");
}

function getWeather(cityOverride = null) {
    const city = cityOverride || cityInput.value || citySelect.value;
    currentCity = city; // Son aranan şehri güncelle

    if (!city) {
        alert(translations[currentLanguage].selectCityAlert);
        return;
    }

    displayLoading();

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=${currentLanguage}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                // API'den dönen hata mesajını kullanmaya çalışalım (varsa)
                return response.json().then(errData => {
                    throw new Error(errData.message || translations[currentLanguage].cityNotFound);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.cod && data.cod !== 200) { // API'den başarılı ama anlamsız bir cevap gelirse
                displayError(data.message || translations[currentLanguage].errorOccurred);
                return;
            }
            // İkonu almak için
            const iconCode = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

            const t = translations[currentLanguage];
            weatherResultDiv.innerHTML = `
                <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
                <h2>${data.name} (${data.sys.country})</h2>
                <p><strong>${t.temperature}:</strong> ${data.main.temp.toFixed(1)}°C</p>
                <p><strong>${t.weather}:</strong> ${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}</p>
                <p><strong>${t.feelsLike}:</strong> ${data.main.feels_like.toFixed(1)}°C</p>
                <p><strong>${t.humidity}:</strong> ${data.main.humidity}%</p>
                <p><strong>${t.windSpeed}:</strong> ${data.wind.speed.toFixed(1)} m/s</p>
                <p><strong>${t.pressure}:</strong> ${data.main.pressure} hPa</p>
            `;
            weatherResultDiv.classList.add("active");
        })
        .catch(error => {
            console.error("Hava durumu alınırken hata:", error);
            displayError(error.message || translations[currentLanguage].errorOccurred);
        });
}

function handleCitySelectChange() {
    if (citySelect.value) {
        cityInput.value = citySelect.value;
        // İsteğe bağlı: Seçim yapıldığında direkt hava durumunu getir
        // getWeather(); 
    }
}

function handleLanguageChange() {
    currentLanguage = languageSelect.value;
    localStorage.setItem('weatherAppLanguage', currentLanguage);
    updateUIText();
    if (currentCity) { // Eğer daha önce bir şehir arandıysa, o şehrin bilgisini yeni dilde getir
        getWeather(currentCity);
    } else if (cityInput.value || citySelect.value) { // Input veya select'te bir değer varsa
        getWeather();
    }
}

function toggleMode() {
    document.body.classList.toggle("dark-mode");
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('weatherAppMode', isDarkMode ? 'dark' : 'light');
    updateUIText(); // Buton metnini/ikonunu güncellemek için
}

// Event Listeners
citySelect.addEventListener("change", handleCitySelectChange);
getWeatherButton.addEventListener("click", () => getWeather());
cityInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        getWeather();
    }
});
languageSelect.addEventListener("change", handleLanguageChange);
modeButton.addEventListener("click", toggleMode);

// Sayfa yüklendiğinde başlangıç ayarlarını yap
document.addEventListener('DOMContentLoaded', applyInitialPreferences);