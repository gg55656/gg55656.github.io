// Poprawki, mała refaktoryzacja kodu aby był bardziej czytelny,
// pomoc z promise i dodanie searchnumber aby uniknąć wyświetlania nieaktualnych wyników wyszukiwania via GPT 6.1 Terra
const apiKey = "d83e450c1e3c5aca596fc2a16531ee64";
const form = document.querySelector("#search-form");
const cityInput = document.querySelector("#city-input");
const currentWeather = document.querySelector("#current-weather");
const forecast = document.querySelector("#forecast");
let searchNumber = 0;

form.addEventListener("submit", event => {
    event.preventDefault();
    const city = cityInput.value.trim();

    if (!city) {
        cityInput.setCustomValidity("Wpisz miejscowość.");
        cityInput.reportValidity();
        return;
    }

    searchWeather(city);
});

cityInput.addEventListener("input", () => cityInput.setCustomValidity(""));

async function searchWeather(city) {
    const currentSearch = ++searchNumber;
    showMessage(currentWeather, "Aktualna pogoda", "Pobieranie danych...");
    showMessage(forecast, "Prognoza na 5 dni", "Pobieranie danych...");

    try {
        const current = await getCurrentWeather(city);
        if (currentSearch !== searchNumber) return;

        showCurrentWeather(current);
        const forecastData = await getForecast(current.coord.lat, current.coord.lon);
        if (currentSearch !== searchNumber) return;

        showForecast(forecastData);
    } catch (error) {
        if (currentSearch !== searchNumber) return;
        showMessage(forecast, "Prognoza na 5 dni", error.message);
        if (!currentWeather.querySelector(".weather-details")) {
            showMessage(currentWeather, "Aktualna pogoda", error.message);
        }
    }
}

function getCurrentWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pl`;

    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url);
        request.responseType = "json";
        request.onload = () => {
            if (request.status === 200) {
                console.log("Aktualna pogoda:", request.response);
                resolve(request.response);
            } else {
                reject(new Error(request.status === 404
                    ? "Nie znaleziono miejscowości. Sprawdź jej nazwę."
                    : "Nie udało się pobrać pogody. Sprawdź klucz API i spróbuj ponownie."));
            }
        };
        request.onerror = () => reject(new Error("Nie udało się połączyć z serwisem pogodowym."));
        request.send();
    });
}

async function getForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pl`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Nie udało się pobrać prognozy. Spróbuj ponownie.");
    }

    const data = await response.json();
    console.log("Prognoza:", data);
    return data;
}

function showMessage(section, title, message) {
    const heading = document.createElement("h2");
    const text = document.createElement("p");
    heading.textContent = title;
    text.textContent = message;
    section.replaceChildren(heading, text);
}

function createText(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;
    element.className = className;
    return element;
}

function createWeatherIcon(code) {
    const icon = document.createElement("img");
    icon.className = "weather-icon";
    icon.src = `assets/${code}.webp`;
    icon.alt = "";
    return icon;
}

function showCurrentWeather(data) {
    const heading = createText("h2", "Aktualna pogoda");
    const details = document.createElement("div");
    details.className = "weather-details";
    details.append(
        createText("h3", `${data.name}, ${data.sys.country}`),
        createWeatherIcon(data.weather[0].icon),
        createText("p", `${Math.round(data.main.temp)}°C`, "temperature"),
        createText("p", data.weather[0].description),
        createText("p", `Wilgotność: ${data.main.humidity}% · Wiatr: ${data.wind.speed} m/s`, "weather-extra")
    );
    currentWeather.replaceChildren(heading, details);
}

function showForecast(data) {
    const heading = createText("h2", "Prognoza na 5 dni");
    const list = document.createElement("div");
    list.className = "forecast-list";
    let currentDate = "";
    let dayList;

    for (const item of data.list) {
        const date = new Date((item.dt + data.city.timezone) * 1000);
        const dateKey = date.toISOString().slice(0, 10);

        if (dateKey !== currentDate) {
            currentDate = dateKey;
            const day = document.createElement("section");
            day.className = "forecast-day";
            const dayTitle = date.toLocaleDateString("pl-PL", {
                timeZone: "UTC", weekday: "long", day: "numeric", month: "long"
            });
            dayList = document.createElement("div");
            dayList.className = "forecast-hours";
            day.append(createText("h3", dayTitle), dayList);
            list.append(day);
        }

        dayList.append(createForecastCard(item, data.city.timezone));
    }

    forecast.replaceChildren(heading, list);
}

function createForecastCard(item, timezone) {
    const card = document.createElement("article");
    card.className = "forecast-card";
    const date = new Date((item.dt + timezone) * 1000);
    const dateText = date.toLocaleTimeString("pl-PL", {
        timeZone: "UTC", hour: "2-digit", minute: "2-digit"
    });

    card.append(
        createText("p", dateText, "forecast-time"),
        createWeatherIcon(item.weather[0].icon),
        createText("p", `${Math.round(item.main.temp)}°C`, "forecast-temperature"),
        createText("p", item.weather[0].description)
    );
    return card;
}
