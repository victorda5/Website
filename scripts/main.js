"use strict";
const geoCodeApiKey = "0a1c5379fd1f43488d7be11e45365aa1";
const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
const localDate = new Intl.DateTimeFormat(navigator.language, {
  dateStyle: "full",
});
const weatherContent = document.querySelector(".weather");
const searchInput = document.querySelector(".weather__search form input");

const getJSON = async url => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (err) {
    throw new Error("Something went wrong... 😓");
  }
};

const getWeatherIcon = code => {
  if (code < 10) return "☀️";
  if (code < 25) return "🌤️";
  if (code < 50) return "⛅";
  if (code < 60) return "🌦️";
  if (code < 70) return "🌧️";
  if (code < 80) return "🌨️";
  if (code < 100) return "⛈️";
  return "🤔";
};

const getDayLetter = date =>
  date
    .toString()
    .slice(0, 3)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();

const renderWeather = (data, place) => {
  /*Removes prev error if exists*/
  const errorDiv = weatherContent.querySelector(".weather__error");
  if (errorDiv) {
    weatherContent.removeChild(errorDiv);
    console.log("removed error div");
  }
  /*Removes prev weather card if exists*/
  const prevWeatherCard = weatherContent.querySelector(".weather__card");
  if (prevWeatherCard) {
    weatherContent.removeChild(prevWeatherCard);
    console.log("removed previous card");
  }

  const card = document.createElement("div");
  card.classList.add("weather__item");
  card.classList.add("weather__card");

  const title = document.createElement("h2");
  title.textContent = place;

  const info = document.createElement("div");
  info.classList.add("weather__info");
  info.classList.add("weather__main-info");
  const temp = document.createElement("h3");
  temp.textContent = `${data.current_weather.temperature}ºC`;
  const icon = document.createElement("span");
  icon.textContent = getWeatherIcon(data.current_weather.weathercode);
  info.appendChild(temp);
  info.appendChild(icon);

  const details = document.createElement("div");
  details.classList.add("weather__info");
  details.classList.add("weather__other-details");
  const maxMinTemps = document.createElement("p");
  const maxTemp = Math.trunc(data.daily.temperature_2m_max[0]);
  const minTemp = Math.trunc(data.daily.temperature_2m_min[0]);
  maxMinTemps.textContent = `${maxTemp}ºC/${minTemp}ºC`;
  details.appendChild(maxMinTemps);

  const lastWeek = document.createElement("div");
  lastWeek.className = "weather__last-week";
  /*Creates and inserts all week days with letter and icon*/
  data.daily.weathercode.forEach((code, i) => {
    const weekDay = document.createElement("div");
    const weekDayLetters = document.createElement("span");
    weekDayLetters.textContent = getDayLetter(
      localDate.format(new Date(data.daily.time[i]))
    );
    weekDay.appendChild(weekDayLetters);
    weekDay.append(getWeatherIcon(code));
    lastWeek.appendChild(weekDay);
  });

  card.appendChild(title);
  card.appendChild(info);
  card.appendChild(details);
  card.appendChild(lastWeek);
  weatherContent.prepend(card);
};

const getWeather = async (lat, lng) => {
  try {
    const data = await getJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=${timeZone}`
    );
    return data;
  } catch (err) {
    throw err;
  }
};

const renderError = error => {
  /*Removes prev error if exists*/
  const prevError = weatherContent.querySelector(".weather__error");
  if (prevError) {
    weatherContent.removeChild(prevError);
  }
  const errorDiv = document.createElement("div");
  errorDiv.className = "weather__error";
  errorDiv.textContent = error.message;
  weatherContent.appendChild(errorDiv);
};

const searchWeather = async (data, lat, lng) => {
  try {
    const place = data.results[0].formatted;
    if (!place) {
      throw new Error("Cannot find city 🗺️");
    }
    const weather = await getWeather(lat, lng);
    renderWeather(weather, place);
  } catch (err) {
    throw err;
  }
};

const searchByLocation = async () => {
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, () =>
        reject(new Error("Access to location denied ❌📡"))
      );
    });
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const data = await getJSON(
      `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${geoCodeApiKey}`
    );
    searchWeather(data, lat, lng);
  } catch (err) {
    renderError(err);
  }
};

const searchByCity = async city => {
  try {
    const data = await getJSON(
      `https://api.opencagedata.com/geocode/v1/json?q=${city}&key=${geoCodeApiKey}`
    );
    if (!data.results.length > 0) {
      throw new Error("Cannot find city 🗺️");
    }
    const lat = data.results[0].bounds.northeast.lat;
    const lng = data.results[0].bounds.northeast.lng;
    searchWeather(data, lat, lng);
  } catch (err) {
    renderError(err);
  }
};

document
  .querySelector(".weather__search button")
  .addEventListener("click", searchByLocation);

document
  .querySelector(".weather__search form button")
  .addEventListener("click", e => {
    e.preventDefault();
    const input = searchInput.value;
    if (!input) return;
    searchByCity(input);
    searchInput.value = "";
  });
