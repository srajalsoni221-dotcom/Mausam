import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.78;

type DailyForecast = {
  date: string;
  weatherCode: number;
  maxTemp: number;
  minTemp: number;
  rainChance: number;
  uvIndex: number;
};

type PreferenceMap = Record<string, boolean>;

type WeatherAlertData = {
  temperature: number;
  rainChance: number;
  windSpeed: number;
  uvIndex: number;
  aqi: number;
};

export default function HomeScreen() {
  const { city } = useLocalSearchParams<{ city?: string }>();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Home');

  const drawerX = useRef(
    new Animated.Value(-DRAWER_WIDTH)
  ).current;

  const [currentTime, setCurrentTime] = useState(new Date());

  const [weather, setWeather] = useState<{
    temperature: number;
    feelsLike: number;
    humidity: number;
    rainChance: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    isDay: boolean;
    sunrise: string;
    sunset: string;
    uvIndex: number;
    aqi: number;
    hourly: {
      time: string;
      temperature: number;
      weatherCode: number;
    }[];
    daily: DailyForecast[];
  } | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(false);

  const [weatherError, setWeatherError] =
    useState(false);

  const [resolvedLocation, setResolvedLocation] =
    useState<string | null>(null);

  // STEP 7 - CURRENT LOCATION / GPS
  const [currentLocation, setCurrentLocation] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [useGpsLocation, setUseGpsLocation] =
    useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [locationError, setLocationError] =
    useState<string | null>(null);

  // STEP 8 - SAVED LOCATIONS
  const [savedLocations, setSavedLocations] =
    useState<string[]>([
      'Bhopal, Madhya Pradesh',
    ]);

  const [selectedCityOverride, setSelectedCityOverride] =
    useState<string | null>(null);

  // STEP 10/11 - PERSONALIZATION + SETTINGS
  const [interests, setInterests] =
    useState<PreferenceMap>({
      Fitness: true,
      Travel: true,
      Health: true,
      Beach: false,
      Agriculture: false,
      Family: true,
      Commuting: true,
      Events: false,
    });

  const [activities, setActivities] =
    useState<PreferenceMap>({
      Running: true,
      Cycling: false,
      Walking: true,
      Outdoor: true,
      Driving: false,
    });

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [healthAlertsEnabled, setHealthAlertsEnabled] =
    useState(true);

  const [rainAlertsEnabled, setRainAlertsEnabled] =
    useState(true);

  const [assistantLanguage, setAssistantLanguage] =
    useState('English');

  const [useCelsius, setUseCelsius] =
    useState(true);

  const [useKmH, setUseKmH] =
    useState(true);

  const [darkTheme, setDarkTheme] =
    useState(false);

  const [assistantText, setAssistantText] =
    useState('');

  const [mapCoordinates, setMapCoordinates] =
    useState<{ latitude: number; longitude: number } | null>(null);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const openScreen = (screen: string) => {
    closeMenu();

    if (screen === 'Search Location') {
      router.push('/search');
      return;
    }

    setActiveScreen(screen);
  };

  /* STEP 7 - CURRENT LOCATION / GPS */

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        setLocationError(
          'Location permission was denied. Please allow location access.'
        );
        return;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setUseGpsLocation(true);
    } catch (error) {
      console.log(
        'MAUSAM LOCATION ERROR:',
        error
      );

      setLocationError(
        'Could not get your current location. Please try again.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  /* CURRENT TIME */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* WEATHER */

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      const selectedCity =
        selectedCityOverride ||
        (typeof city === 'string' && city.trim()
          ? city.trim()
          : 'Bhopal');

      try {
        setWeatherLoading(true);
        setWeatherError(false);

        /* STEP 7 - LOCATION SOURCE */

        let latitude: number;
        let longitude: number;
        let locationLabel: string;

        if (useGpsLocation && currentLocation) {
          latitude = currentLocation.latitude;
          longitude = currentLocation.longitude;

          setMapCoordinates({ latitude, longitude });

          const reverse =
            await Location.reverseGeocodeAsync({
              latitude,
              longitude,
            });

          const reversePlace = reverse?.[0];

          const locality =
            reversePlace?.city ||
            reversePlace?.district ||
            reversePlace?.subregion ||
            reversePlace?.name;

          const region = reversePlace?.region;

          if (
            locality &&
            region &&
            locality !== region
          ) {
            locationLabel = `${locality}, ${region}`;
          } else {
            locationLabel =
              locality ||
              region ||
              'Current Location';
          }
        } else {
          const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
              selectedCity
            )}&count=1&language=en&format=json&countryCode=IN`
          );

          if (!geoResponse.ok) {
            throw new Error(
              'Location search failed'
            );
          }

          const geoData =
            await geoResponse.json();
          const place =
            geoData?.results?.[0];

          if (!place) {
            throw new Error(
              'Location not found'
            );
          }

          latitude = place.latitude;
          longitude = place.longitude;

          setMapCoordinates({ latitude, longitude });

          locationLabel =
            place.admin1
              ? `${place.name}, ${place.admin1}`
              : place.name;
        }

        /* WEATHER */

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code,is_day&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&forecast_days=7&timezone=auto`
        );

        /* AQI */

        const aqiResponse = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,pm2_5,pm10&timezone=auto`
        );

        if (!weatherResponse.ok) {
          throw new Error(
            'Weather request failed'
          );
        }

        if (!aqiResponse.ok) {
          throw new Error(
            'AQI request failed'
          );
        }

        const data = await weatherResponse.json();
        const aqiData = await aqiResponse.json();

        if (cancelled) return;

        const current = data.current;
        const daily = data.daily;

        /* HOURLY FORECAST */

        const currentDate = new Date();

        const hourlyItems: {
          time: string;
          temperature: number;
          weatherCode: number;
        }[] = [];

        for (
          let i = 0;
          i < data.hourly.time.length &&
          hourlyItems.length < 6;
          i++
        ) {
          const itemTime = new Date(
            data.hourly.time[i]
          );

          if (itemTime >= currentDate) {
            hourlyItems.push({
              time: data.hourly.time[i],
              temperature: Math.round(
                data.hourly.temperature_2m[i]
              ),
              weatherCode:
                data.hourly.weather_code[i],
            });
          }
        }

        /* DAILY FORECAST */

        const dailyItems: DailyForecast[] =
          data.daily.time.map(
            (date: string, index: number) => ({
              date,
              weatherCode:
                data.daily.weather_code[index],
              maxTemp: Math.round(
                data.daily.temperature_2m_max[
                  index
                ]
              ),
              minTemp: Math.round(
                data.daily.temperature_2m_min[
                  index
                ]
              ),
              rainChance: Math.round(
                data.daily
                  .precipitation_probability_max?.[
                  index
                ] ?? 0
              ),
              uvIndex: Math.round(
                data.daily.uv_index_max?.[
                  index
                ] ?? 0
              ),
            })
          );

        /* LOCATION */

        setResolvedLocation(locationLabel);

        /* WEATHER STATE */

        setWeather({
          temperature: Math.round(
            current.temperature_2m
          ),

          feelsLike: Math.round(
            current.apparent_temperature
          ),

          humidity: Math.round(
            current.relative_humidity_2m
          ),

          rainChance: Math.round(
            current.precipitation_probability ?? 0
          ),

          windSpeed: Math.round(
            current.wind_speed_10m
          ),

          windDirection: Math.round(
            current.wind_direction_10m
          ),

          weatherCode: current.weather_code,

          isDay: current.is_day === 1,

          sunrise:
            daily.sunrise?.[0] ?? '',

          sunset:
            daily.sunset?.[0] ?? '',

          uvIndex: Math.round(
            daily.uv_index_max?.[0] ?? 0
          ),

          aqi: Math.round(
            aqiData.current?.european_aqi ?? 0
          ),

          hourly: hourlyItems,

          daily: dailyItems,
        });
      } catch (error) {
        console.log(
          'MAUSAM WEATHER ERROR:',
          error
        );

        if (!cancelled) {
          setWeatherError(true);
          setWeather(null);
        }
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    };

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [city, currentLocation, useGpsLocation, selectedCityOverride]);

  /* STEP 8 - SAVED LOCATION ACTIONS */

  const saveCurrentLocation = () => {
    const label =
      resolvedLocation ||
      (typeof city === 'string' ? city : null) ||
      'Bhopal, Madhya Pradesh';

    setSavedLocations((current) =>
      current.includes(label)
        ? current
        : [...current, label]
    );
  };

  const openSavedLocation = (label: string) => {
    const cityName = label.split(',')[0].trim();
    setUseGpsLocation(false);
    setCurrentLocation(null);
    setSelectedCityOverride(cityName);
    setActiveScreen('Home');
  };

  const removeSavedLocation = (label: string) => {
    setSavedLocations((current) =>
      current.filter((item) => item !== label)
    );
  };

  /* STEP 11 - ALERTS */

  const getAlerts = (data: WeatherAlertData | null) => {
    if (!data) return [];

    const alerts: string[] = [];

    if (rainAlertsEnabled && data.rainChance >= 60) {
      alerts.push('High chance of rain. Carry an umbrella.');
    }

    if (data.windSpeed >= 35) {
      alerts.push('Strong winds expected. Be careful outdoors.');
    }

    if (healthAlertsEnabled && data.uvIndex >= 6) {
      alerts.push('High UV index. Use sunscreen and stay hydrated.');
    }

    if (healthAlertsEnabled && data.aqi > 100) {
      alerts.push('Air quality is elevated. Consider reducing long outdoor activity.');
    }

    if (data.temperature >= 40) {
      alerts.push('Very hot conditions. Avoid prolonged outdoor exposure.');
    }

    return alerts;
  };

  const alerts = getAlerts(weather);

  /* DRAWER */

  useEffect(() => {
    Animated.spring(drawerX, {
      toValue: menuOpen
        ? 0
        : -DRAWER_WIDTH,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [menuOpen]);

  /* DAY / NIGHT */

  const isNight = weather
    ? !weather.isDay
    : currentTime.getHours() >= 18 ||
      currentTime.getHours() < 6;

  /* TIME */

  const formatTime = (value: string) => {
    if (!value) return '--:--';

    const date = new Date(value);

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* SUN POSITION */

  const getSunProgress = () => {
    if (
      !weather?.sunrise ||
      !weather?.sunset
    ) {
      return 0.5;
    }

    const now = currentTime.getTime();

    const sunrise = new Date(
      weather.sunrise
    ).getTime();

    const sunset = new Date(
      weather.sunset
    ).getTime();

    if (now <= sunrise) return 0;

    if (now >= sunset) return 1;

    return (
      (now - sunrise) /
      (sunset - sunrise)
    );
  };

  /* WEATHER EMOJI */

  const getWeatherEmoji = (
    code: number,
    isDay = true
  ) => {
    if (code === 0) {
      return isDay ? '☀️' : '🌙';
    }

    if (code === 1 || code === 2) {
      return '🌤️';
    }

    if (code === 3) {
      return '☁️';
    }

    if (code === 45 || code === 48) {
      return '🌫️';
    }

    if (code >= 51 && code <= 57) {
      return '🌦️';
    }

    if (code >= 61 && code <= 67) {
      return '🌧️';
    }

    if (code >= 71 && code <= 77) {
      return '🌨️';
    }

    if (code >= 80 && code <= 82) {
      return '🌦️';
    }

    if (code >= 85 && code <= 86) {
      return '🌨️';
    }

    if (code >= 95) {
      return '⛈️';
    }

    return '🌤️';
  };

  /* WEATHER CONDITION */

  const getWeatherCondition = (
    code: number
  ) => {
    if (code === 0) return 'Clear Sky';

    if (code === 1 || code === 2) {
      return 'Partly Cloudy';
    }

    if (code === 3) {
      return 'Overcast';
    }

    if (code === 45 || code === 48) {
      return 'Foggy';
    }

    if (code >= 51 && code <= 57) {
      return 'Drizzle';
    }

    if (code >= 61 && code <= 67) {
      return 'Rainy';
    }

    if (code >= 71 && code <= 77) {
      return 'Snowy';
    }

    if (code >= 80 && code <= 82) {
      return 'Rain Showers';
    }

    if (code >= 85 && code <= 86) {
      return 'Snow Showers';
    }

    if (code >= 95) {
      return 'Thunderstorm';
    }

    return 'Partly Cloudy';
  };

  /* WIND */

  const getWindDirection = (
    degrees: number
  ) => {
    const directions = [
      'N',
      'NE',
      'E',
      'SE',
      'S',
      'SW',
      'W',
      'NW',
    ];

    return directions[
      Math.round(degrees / 45) % 8
    ];
  };

  /* AQI */

  const getAQIStatus = (
    aqi: number
  ) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy';
    return 'Poor';
  };

  /* DAILY DAY NAME */

  const getDayName = (
    dateString: string,
    index: number
  ) => {
    if (index === 0) {
      return 'Today';
    }

    const date = new Date(
      `${dateString}T12:00:00`
    );

    return date.toLocaleDateString([], {
      weekday: 'short',
    });
  };

  const formatTemperature = (value: number) => {
    if (useCelsius) return `${Math.round(value)}°C`;
    return `${Math.round(value * 9 / 5 + 32)}°F`;
  };

  const formatWindSpeed = (value: number) => {
    if (useKmH) return `${Math.round(value)} km/h`;
    return `${Math.round(value * 0.621371)} mph`;
  };

  return (
    <View style={styles.screen}>
      {/* BACKGROUND */}

      <View
        style={[
          styles.skyBackground,
          isNight
            ? styles.nightBackground
            : styles.dayBackground,
        ]}
      />

      <SafeAreaView
        style={styles.safeArea}
      >
        {activeScreen === 'Home' ? (
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.container
            }
          >
            {/* HEADER */}

            <View style={styles.header}>
              <Pressable
                style={styles.roundButton}
                onPress={() =>
                  setMenuOpen(true)
                }
              >
                <Text
                  style={styles.menuIcon}
                >
                  ☰
                </Text>
              </Pressable>

              <Text style={styles.logo}>
                ☁ MAUSAM 🌤️
              </Text>

              <Pressable
                style={styles.roundButton}
                onPress={() => openScreen('Voice Assistant')}
              >
                <Text
                  style={styles.micIcon}
                >
                  🎙️
                </Text>
              </Pressable>
            </View>

            {/* SEARCH */}

            <Pressable
              style={styles.searchBox}
              onPress={() =>
                router.push('/search')
              }
            >
              <Text
                style={styles.searchIcon}
              >
                ⌕
              </Text>

              <Text
                style={styles.searchText}
              >
                Search city or location
              </Text>
            </Pressable>

            {/* LOCATION */}

            <View
              style={styles.locationRow}
            >
              <Text
                style={styles.locationIcon}
              >
                ⌖
              </Text>

              <Text
                style={styles.locationText}
              >
                {resolvedLocation ||
                  city ||
                  'Bhopal, Madhya Pradesh'}
              </Text>
            </View>

            <Pressable
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              <Text
                style={styles.currentLocationIcon}
              >
                📍
              </Text>

              <Text
                style={styles.currentLocationText}
              >
                {locationLoading
                  ? 'Getting current location...'
                  : 'Use My Current Location'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.saveLocationButton}
              onPress={saveCurrentLocation}
            >
              <Text style={styles.saveLocationIcon}>☆</Text>
              <Text style={styles.saveLocationText}>Save This Location</Text>
            </Pressable>

            {locationError && (
              <Text
                style={styles.locationError}
              >
                {locationError}
              </Text>
            )}

            {weatherError && (
              <Text
                style={styles.weatherError}
              >
                Weather data could not be
                loaded. Please try again.
              </Text>
            )}

            {/* WEATHER CARD */}

            <BlurView
              intensity={45}
              tint="light"
              style={styles.weatherCard}
            >
              <Text
                style={styles.temperature}
              >
                {weatherLoading
                  ? '--°C'
                  : weather
                    ? formatTemperature(weather.temperature)
                    : '--°C'}
              </Text>

              <Text
                style={styles.feelsLike}
              >
                {weatherLoading
                  ? 'Loading weather...'
                  : weather
                    ? `Feels like ${formatTemperature(weather.feelsLike)}`
                    : 'Weather unavailable'}
              </Text>

              <Text
                style={styles.condition}
              >
                {getWeatherEmoji(
                  weather?.weatherCode ?? 2,
                  weather?.isDay ?? !isNight
                )}{' '}
                {weatherLoading
                  ? 'Getting weather...'
                  : weather
                    ? getWeatherCondition(
                        weather.weatherCode
                      )
                    : 'Weather unavailable'}
              </Text>

              {/* SUN */}

              <View
                style={styles.sunArea}
              >
                <View
                  style={styles.sunPath}
                />

                {isNight ? (
                  <Text
                    style={styles.moon}
                  >
                    🌙
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.sun,
                      {
                        position:
                          'absolute',
                        left:
                          getSunProgress() *
                            250 -
                          31,
                        top:
                          75 -
                          Math.sin(
                            getSunProgress() *
                              Math.PI
                          ) *
                            65,
                      },
                    ]}
                  >
                    ☀️
                  </Text>
                )}
              </View>

              {/* SUN TIMES */}

              <View
                style={styles.sunTimes}
              >
                <View>
                  <Text
                    style={styles.sunLabel}
                  >
                    Sunrise
                  </Text>

                  <Text
                    style={styles.sunTime}
                  >
                    {formatTime(
                      weather?.sunrise ?? ''
                    )}
                  </Text>
                </View>

                <View
                  style={styles.sunsetPill}
                >
                  <Text
                    style={styles.sunsetText}
                  >
                    {weatherLoading
                      ? 'Loading...'
                      : isNight
                        ? 'Night time 🌙'
                        : 'Daylight ☀️'}
                  </Text>
                </View>

                <View
                  style={styles.rightTime}
                >
                  <Text
                    style={styles.sunLabel}
                  >
                    Sunset
                  </Text>

                  <Text
                    style={styles.sunTime}
                  >
                    {formatTime(
                      weather?.sunset ?? ''
                    )}
                  </Text>
                </View>
              </View>
            </BlurView>

            {/* QUICK STATS */}

            <View style={styles.quickRow}>
              <InfoCard
                emoji="🌧️"
                title="Rain Chance"
                value={
                  weather
                    ? `${weather.rainChance}%`
                    : '--'
                }
                status={
                  weather
                    ? weather.rainChance >=
                      50
                      ? 'High'
                      : 'Low'
                    : 'Loading'
                }
              />

              <InfoCard
                emoji="💧"
                title="Humidity"
                value={
                  weather
                    ? `${weather.humidity}%`
                    : '--'
                }
                status={
                  weather
                    ? 'Current'
                    : 'Loading'
                }
              />

              <InfoCard
                emoji="💨"
                title="Wind"
                value={
                  weather
                    ? formatWindSpeed(weather.windSpeed)
                    : '--'
                }
                status={
                  weather
                    ? getWindDirection(
                        weather.windDirection
                      )
                    : 'Loading'
                }
              />

              <InfoCard
                emoji="☀️"
                title="UV Index"
                value={
                  weather
                    ? `${weather.uvIndex}`
                    : '--'
                }
                status={
                  weather
                    ? weather.uvIndex >= 6
                      ? 'High'
                      : 'Moderate'
                    : 'Loading'
                }
              />

              <InfoCard
                emoji="🍃"
                title="AQI"
                value={
                  weather
                    ? `${weather.aqi}`
                    : '--'
                }
                status={
                  weather
                    ? getAQIStatus(
                        weather.aqi
                      )
                    : 'Loading'
                }
              />
            </View>

            {/* INSIGHT */}

            <BlurView
              intensity={35}
              tint="light"
              style={styles.insightCard}
            >
              <View
                style={styles.insightText}
              >
                <Text
                  style={
                    styles.insightTitle
                  }
                >
                  ⭐ Today's Insight
                </Text>

                <Text
                  style={
                    styles.insightMain
                  }
                >
                  Morning is a great time
                  for outdoor activities.
                </Text>

                <Text
                  style={styles.insightSub}
                >
                  Low rain chance and
                  pleasant weather expected.
                </Text>
              </View>

              <Text style={styles.runner}>
                🏃
              </Text>
            </BlurView>

            {/* HOURLY */}

            <View
              style={styles.sectionHeader}
            >
              <Text
                style={styles.sectionTitle}
              >
                Hourly Forecast
              </Text>

              <Text
                style={styles.viewAll}
              >
                View All
              </Text>
            </View>

            <BlurView
              intensity={35}
              tint="light"
              style={styles.forecastCard}
            >
              {weather?.hourly?.length ? (
                weather.hourly.map(
                  (item, index) => (
                    <Forecast
                      key={`${item.time}-${index}`}
                      time={
                        index === 0
                          ? 'Now'
                          : new Date(
                                item.time
                              ).toLocaleTimeString(
                                [],
                                {
                                  hour: 'numeric',
                                }
                              )
                      }
                      emoji={getWeatherEmoji(
                        item.weatherCode,
                        true
                      )}
                      temp={`${item.temperature}°`}
                      active={
                        index === 0
                      }
                    />
                  )
                )
              ) : (
                <>
                  <Forecast
                    time="Now"
                    emoji="🌤️"
                    temp="--"
                    active
                  />

                  <Forecast
                    time="Next"
                    emoji="☀️"
                    temp="--"
                  />
                </>
              )}
            </BlurView>

            {/* ================================================= */}
            {/* STEP 6 - 7 DAY FORECAST */}
            {/* ================================================= */}

            <View
              style={[
                styles.sectionHeader,
                styles.dailySectionHeader,
              ]}
            >
              <Text
                style={styles.sectionTitle}
              >
                7-Day Forecast
              </Text>

              <Text
                style={styles.viewAll}
              >
                Daily
              </Text>
            </View>

            <BlurView
              intensity={35}
              tint="light"
              style={
                styles.dailyForecastCard
              }
            >
              {weather?.daily?.length ? (
                weather.daily.map(
                  (item, index) => (
                    <View
                      key={item.date}
                      style={
                        styles.dailyForecastItem
                      }
                    >
                      <View
                        style={
                          styles.dailyDayBox
                        }
                      >
                        <Text
                          style={
                            styles.dailyDay
                          }
                        >
                          {getDayName(
                            item.date,
                            index
                          )}
                        </Text>

                        <Text
                          style={
                            styles.dailyDate
                          }
                        >
                          {new Date(
                            `${item.date}T12:00:00`
                          ).toLocaleDateString(
                            [],
                            {
                              day: 'numeric',
                              month: 'short',
                            }
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.dailyEmoji
                        }
                      >
                        {getWeatherEmoji(
                          item.weatherCode,
                          true
                        )}
                      </Text>

                      <View
                        style={
                          styles.dailyTempBox
                        }
                      >
                        <Text
                          style={
                            styles.dailyMax
                          }
                        >
                          {item.maxTemp}°
                        </Text>

                        <Text
                          style={
                            styles.dailyMin
                          }
                        >
                          {item.minTemp}°
                        </Text>
                      </View>

                      <View
                        style={
                          styles.dailyRainBox
                        }
                      >
                        <Text
                          style={
                            styles.dailyRain
                          }
                        >
                          💧 {item.rainChance}%
                        </Text>

                        <Text
                          style={
                            styles.dailyUV
                          }
                        >
                          UV {item.uvIndex}
                        </Text>
                      </View>
                    </View>
                  )
                )
              ) : (
                <View
                  style={
                    styles.dailyLoading
                  }
                >
                  <Text
                    style={
                      styles.dailyLoadingText
                    }
                  >
                    Loading 7-day forecast...
                  </Text>
                </View>
              )}
            </BlurView>

            {/* STEP 11 - LIVE ALERTS */}

            <Pressable
              onPress={() => openScreen('Health & Alerts')}
            >
              <BlurView
                intensity={35}
                tint="light"
                style={styles.alertCard}
              >
                <Text style={styles.alertIcon}>
                  {alerts.length ? '⚠️' : '🛡️'}
                </Text>

                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {alerts.length
                      ? `${alerts.length} active alert${alerts.length > 1 ? 's' : ''}`
                      : 'No active alerts'}
                  </Text>

                  <Text style={styles.alertText}>
                    {alerts.length
                      ? alerts[0]
                      : 'You are all good! Have a nice day 🌈'}
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
              </BlurView>
            </Pressable>
          </ScrollView>
        ) : (
          <FeatureScreen
            title={activeScreen}
            onHome={() => openScreen('Home')}
            onMenu={() => setMenuOpen(true)}
            weather={weather}
            savedLocations={savedLocations}
            onSaveLocation={saveCurrentLocation}
            onOpenSavedLocation={openSavedLocation}
            onRemoveSavedLocation={removeSavedLocation}
            mapCoordinates={mapCoordinates}
            interests={interests}
            setInterests={setInterests}
            activities={activities}
            setActivities={setActivities}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            healthAlertsEnabled={healthAlertsEnabled}
            setHealthAlertsEnabled={setHealthAlertsEnabled}
            rainAlertsEnabled={rainAlertsEnabled}
            setRainAlertsEnabled={setRainAlertsEnabled}
            assistantLanguage={assistantLanguage}
            setAssistantLanguage={setAssistantLanguage}
            useCelsius={useCelsius}
            setUseCelsius={setUseCelsius}
            useKmH={useKmH}
            setUseKmH={setUseKmH}
            darkTheme={darkTheme}
            setDarkTheme={setDarkTheme}
            assistantText={assistantText}
            setAssistantText={setAssistantText}
            alerts={alerts}
          />
        )}
      </SafeAreaView>

      {/* OVERLAY */}

      {menuOpen && (
        <Pressable
          style={styles.overlay}
          onPress={() =>
            setMenuOpen(false)
          }
        />
      )}

      {/* DRAWER */}

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              {
                translateX: drawerX,
              },
            ],
          },
        ]}
      >
        <BlurView
          intensity={80}
          tint="light"
          style={styles.drawerBlur}
        >
          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.drawerContent
            }
          >
            <View
              style={styles.profileHeader}
            >
              <Text
                style={
                  styles.profileEmoji
                }
              >
                🌤️
              </Text>

              <View>
                <Text
                  style={
                    styles.profileName
                  }
                >
                  Hi, Shaurya! 👋
                </Text>

                <Text
                  style={
                    styles.profileSub
                  }
                >
                  Stay safe, stay updated
                </Text>
              </View>
            </View>

            <MenuTitle title="GENERAL" />

            <MenuItem
              icon="⌂"
              title="Home"
              active={
                activeScreen === 'Home'
              }
              onPress={() =>
                openScreen('Home')
              }
            />

            <MenuItem
              icon="⌕"
              title="Search Location"
              active={
                activeScreen ===
                'Search Location'
              }
              onPress={() =>
                openScreen(
                  'Search Location'
                )
              }
            />

            <MenuItem
              icon="⌖"
              title="Saved Locations"
              active={
                activeScreen ===
                'Saved Locations'
              }
              onPress={() =>
                openScreen(
                  'Saved Locations'
                )
              }
            />

            <MenuItem
              icon="▣"
              title="Weather Map"
              active={
                activeScreen ===
                'Weather Map'
              }
              onPress={() =>
                openScreen(
                  'Weather Map'
                )
              }
            />

            <MenuItem
              icon="▥"
              title="Insights"
              active={
                activeScreen ===
                'Insights'
              }
              onPress={() =>
                openScreen('Insights')
              }
            />

            <MenuTitle
              title="PERSONALIZATION"
            />

            <MenuItem
              icon="♡"
              title="My Interests"
              active={
                activeScreen ===
                'My Interests'
              }
              onPress={() =>
                openScreen(
                  'My Interests'
                )
              }
            />

            <MenuItem
              icon="♧"
              title="Activity Preferences"
              active={
                activeScreen ===
                'Activity Preferences'
              }
              onPress={() =>
                openScreen(
                  'Activity Preferences'
                )
              }
            />

            <MenuItem
              icon="🛡️"
              title="Health & Alerts"
              active={
                activeScreen ===
                'Health & Alerts'
              }
              onPress={() =>
                openScreen(
                  'Health & Alerts'
                )
              }
            />

            <MenuTitle title="ASSISTANT" />

            <MenuItem
              icon="🎙️"
              title="Voice Assistant"
              active={
                activeScreen ===
                'Voice Assistant'
              }
              onPress={() =>
                openScreen(
                  'Voice Assistant'
                )
              }
            />

            <MenuItem
              icon="文"
              title="Assistant Language"
              active={
                activeScreen ===
                'Assistant Language'
              }
              onPress={() =>
                openScreen(
                  'Assistant Language'
                )
              }
            />

            <MenuTitle title="SETTINGS" />

            <MenuItem
              icon="⚙"
              title="App Settings"
              active={
                activeScreen ===
                'App Settings'
              }
              onPress={() =>
                openScreen(
                  'App Settings'
                )
              }
            />

            <MenuItem
              icon="♧"
              title="Notifications"
              active={
                activeScreen ===
                'Notifications'
              }
              onPress={() =>
                openScreen(
                  'Notifications'
                )
              }
            />

            <MenuItem
              icon="🌡️"
              title="Units (°C, km/h)"
              active={
                activeScreen ===
                'Units (°C, km/h)'
              }
              onPress={() =>
                openScreen(
                  'Units (°C, km/h)'
                )
              }
            />

            <MenuItem
              icon="☾"
              title="Theme"
              active={
                activeScreen === 'Theme'
              }
              onPress={() =>
                openScreen('Theme')
              }
            />

            <MenuTitle title="MORE" />

            <MenuItem
              icon="?"
              title="Help & Support"
              active={
                activeScreen ===
                'Help & Support'
              }
              onPress={() =>
                openScreen(
                  'Help & Support'
                )
              }
            />

            <MenuItem
              icon="ⓘ"
              title="About Mausam"
              active={
                activeScreen ===
                'About Mausam'
              }
              onPress={() =>
                openScreen(
                  'About Mausam'
                )
              }
            />

            <MenuItem
              icon="⇥"
              title="Logout"
              active={
                activeScreen === 'Logout'
              }
              onPress={() =>
                openScreen('Logout')
              }
            />
          </ScrollView>
        </BlurView>
      </Animated.View>
    </View>
  );
}

/* INFO CARD */

function InfoCard({
  emoji,
  title,
  value,
  status,
}: {
  emoji: string;
  title: string;
  value: string;
  status: string;
}) {
  return (
    <BlurView
      intensity={35}
      tint="light"
      style={styles.infoCard}
    >
      <Text
        style={styles.infoEmoji}
      >
        {emoji}
      </Text>

      <Text
        style={styles.infoTitle}
      >
        {title}
      </Text>

      <Text
        style={styles.infoValue}
      >
        {value}
      </Text>

      <Text
        style={styles.infoStatus}
      >
        {status}
      </Text>
    </BlurView>
  );
}

/* HOURLY FORECAST */

function Forecast({
  time,
  emoji,
  temp,
  active = false,
}: {
  time: string;
  emoji: string;
  temp: string;
  active?: boolean;
}) {
  return (
    <View
      style={[
        styles.forecastItem,
        active &&
          styles.activeForecast,
      ]}
    >
      <Text
        style={styles.forecastTime}
      >
        {time}
      </Text>

      <Text
        style={styles.forecastEmoji}
      >
        {emoji}
      </Text>

      <Text
        style={styles.forecastTemp}
      >
        {temp}
      </Text>
    </View>
  );
}

/* MENU TITLE */

function MenuTitle({
  title,
}: {
  title: string;
}) {
  return (
    <Text
      style={styles.menuTitle}
    >
      {title}
    </Text>
  );
}

/* MENU ITEM */

function MenuItem({
  icon,
  title,
  active = false,
  onPress,
}: {
  icon: string;
  title: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.menuItem,
        active &&
          styles.activeMenuItem,
      ]}
      onPress={onPress}
    >
      <Text
        style={styles.menuItemIcon}
      >
        {icon}
      </Text>

      <Text
        style={[
          styles.menuItemText,
          active &&
            styles.activeMenuText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* SIMPLE SCREEN */

function FeatureScreen({
  title,
  onHome,
  onMenu,
  weather,
  savedLocations,
  onSaveLocation,
  onOpenSavedLocation,
  onRemoveSavedLocation,
  mapCoordinates,
  interests,
  setInterests,
  activities,
  setActivities,
  notificationsEnabled,
  setNotificationsEnabled,
  healthAlertsEnabled,
  setHealthAlertsEnabled,
  rainAlertsEnabled,
  setRainAlertsEnabled,
  assistantLanguage,
  setAssistantLanguage,
  useCelsius,
  setUseCelsius,
  useKmH,
  setUseKmH,
  darkTheme,
  setDarkTheme,
  assistantText,
  setAssistantText,
  alerts,
}: {
  title: string;
  onHome: () => void;
  onMenu: () => void;
  weather: any;
  savedLocations: string[];
  onSaveLocation: () => void;
  onOpenSavedLocation: (label: string) => void;
  onRemoveSavedLocation: (label: string) => void;
  mapCoordinates: { latitude: number; longitude: number } | null;
  interests: PreferenceMap;
  setInterests: React.Dispatch<React.SetStateAction<PreferenceMap>>;
  activities: PreferenceMap;
  setActivities: React.Dispatch<React.SetStateAction<PreferenceMap>>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  healthAlertsEnabled: boolean;
  setHealthAlertsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  rainAlertsEnabled: boolean;
  setRainAlertsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  assistantLanguage: string;
  setAssistantLanguage: React.Dispatch<React.SetStateAction<string>>;
  useCelsius: boolean;
  setUseCelsius: React.Dispatch<React.SetStateAction<boolean>>;
  useKmH: boolean;
  setUseKmH: React.Dispatch<React.SetStateAction<boolean>>;
  darkTheme: boolean;
  setDarkTheme: React.Dispatch<React.SetStateAction<boolean>>;
  assistantText: string;
  setAssistantText: React.Dispatch<React.SetStateAction<string>>;
  alerts: string[];
}) {
  const isDark = darkTheme;

  const temp = (value: number) => {
    if (useCelsius) return `${Math.round(value)}°C`;
    return `${Math.round(value * 9 / 5 + 32)}°F`;
  };

  const speed = (value: number) => {
    if (useKmH) return `${Math.round(value)} km/h`;
    return `${Math.round(value * 0.621371)} mph`;
  };

  const togglePreference = (
    setter: React.Dispatch<React.SetStateAction<PreferenceMap>>,
    key: string
  ) => {
    setter((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const renderHeader = () => (
    <View style={styles.simpleHeader}>
      <Pressable style={styles.roundButton} onPress={onMenu}>
        <Text style={styles.menuIcon}>☰</Text>
      </Pressable>

      <Text style={styles.logo}>☁ MAUSAM 🌤️</Text>

      <Pressable style={styles.roundButton} onPress={onHome}>
        <Text style={styles.homeIcon}>⌂</Text>
      </Pressable>
    </View>
  );

  const renderCard = (
    children: React.ReactNode,
    extraStyle?: any
  ) => (
    <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={[styles.featureCard, extraStyle]}>
      {children}
    </BlurView>
  );

  const renderToggleList = (
    values: PreferenceMap,
    setter: React.Dispatch<React.SetStateAction<PreferenceMap>>
  ) => (
    <View>
      {Object.keys(values).map((key) => (
        <View key={key} style={styles.settingRow}>
          <Text style={styles.settingLabel}>{key}</Text>
          <Switch
            value={values[key]}
            onValueChange={() => togglePreference(setter, key)}
          />
        </View>
      ))}
    </View>
  );

  let content: React.ReactNode;

  if (title === 'Saved Locations') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>📍</Text>
            <Text style={styles.featureTitle}>Saved Locations</Text>
            <Text style={styles.featureText}>
              Keep your important places one tap away.
            </Text>
          </>
        )}

        {savedLocations.map((location) => (
          <Pressable
            key={location}
            style={styles.savedLocationRow}
            onPress={() => onOpenSavedLocation(location)}
          >
            <Text style={styles.savedLocationPin}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.savedLocationTitle}>{location}</Text>
              <Text style={styles.savedLocationSub}>Tap to view weather</Text>
            </View>
            <Pressable onPress={() => onRemoveSavedLocation(location)}>
              <Text style={styles.deleteText}>×</Text>
            </Pressable>
          </Pressable>
        ))}

        <Pressable style={styles.primaryButton} onPress={onSaveLocation}>
          <Text style={styles.primaryButtonText}>＋ Save Current Location</Text>
        </Pressable>
      </>
    );
  } else if (title === 'Weather Map') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureTitle}>Weather Map</Text>
            <Text style={styles.featureText}>
              Live location layers for rain, temperature, wind and AQI.
            </Text>
          </>
        )}

        <View style={styles.mapMock}>
          <View style={styles.mapGrid} />
          <Text style={styles.mapCloud}>☁️</Text>
          <Text style={styles.mapRain}>🌧️</Text>
          <Text style={styles.mapSun}>☀️</Text>
          <Text style={styles.mapPin}>📍</Text>
          <Text style={styles.mapLabel}>Current Weather</Text>
        </View>

        {mapCoordinates && (
          <Text style={styles.coordinateText}>
            {mapCoordinates.latitude.toFixed(4)}, {mapCoordinates.longitude.toFixed(4)}
          </Text>
        )}

        <View style={styles.layerRow}>
          <Text style={styles.layerChip}>🌧 Rain</Text>
          <Text style={styles.layerChip}>🌡 Temp</Text>
          <Text style={styles.layerChip}>💨 Wind</Text>
          <Text style={styles.layerChip}>🍃 AQI</Text>
        </View>
      </>
    );
  } else if (title === 'Insights') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>⭐</Text>
            <Text style={styles.featureTitle}>Mausam Insights</Text>
            <Text style={styles.featureText}>
              Simple recommendations based on your current weather.
            </Text>
          </>
        )}
        <InsightRow icon="🏃" title="Outdoor Activity" text="Check rain, heat, UV and wind before exercising." />
        <InsightRow icon="🧴" title="Health" text="UV and AQI can help you decide how long to stay outside." />
        <InsightRow icon="🚗" title="Commute" text="Fog, rain and strong wind can affect your travel comfort." />
        <InsightRow icon="🧳" title="Travel" text="Use the 7-day forecast to plan clothes and outdoor activities." />
      </>
    );
  } else if (title === 'My Interests') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>♡</Text>
            <Text style={styles.featureTitle}>My Interests</Text>
            <Text style={styles.featureText}>Choose what Mausam should prioritize for you.</Text>
          </>
        )}
        {renderToggleList(interests, setInterests)}
      </>
    );
  } else if (title === 'Activity Preferences') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>🏃</Text>
            <Text style={styles.featureTitle}>Activity Preferences</Text>
            <Text style={styles.featureText}>Personalize activity-related weather guidance.</Text>
          </>
        )}
        {renderToggleList(activities, setActivities)}
      </>
    );
  } else if (title === 'Health & Alerts') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureTitle}>Health & Alerts</Text>
            <Text style={styles.featureText}>Current weather conditions that may need attention.</Text>
          </>
        )}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Health alerts</Text>
            <Text style={styles.settingSub}>UV, AQI and extreme heat notices</Text>
          </View>
          <Switch value={healthAlertsEnabled} onValueChange={setHealthAlertsEnabled} />
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Rain alerts</Text>
            <Text style={styles.settingSub}>Notify when rain probability is high</Text>
          </View>
          <Switch value={rainAlertsEnabled} onValueChange={setRainAlertsEnabled} />
        </View>
        {alerts.length ? alerts.map((alert) => (
          <View key={alert} style={styles.alertListItem}>
            <Text style={styles.alertListIcon}>⚠️</Text>
            <Text style={styles.alertListText}>{alert}</Text>
          </View>
        )) : (
          <View style={styles.alertListItem}>
            <Text style={styles.alertListIcon}>✅</Text>
            <Text style={styles.alertListText}>No active weather alerts right now.</Text>
          </View>
        )}
      </>
    );
  } else if (title === 'Voice Assistant') {
    const response = assistantText.trim()
      ? `Mausam: I can help with weather, AQI, UV, rain, wind and forecasts. You asked “${assistantText.trim()}”.`
      : 'Try asking: “Will it rain today?” or “Is it good for a run?”';

    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.voiceOrb}>🎙️</Text>
            <Text style={styles.featureTitle}>Voice Assistant</Text>
            <Text style={styles.featureText}>Your weather assistant is ready for voice integration.</Text>
          </>
        )}
        <TextInput
          value={assistantText}
          onChangeText={setAssistantText}
          placeholder="Ask Mausam something..."
          placeholderTextColor="#8A97AA"
          style={styles.assistantInput}
        />
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>🎙️ Start Listening</Text>
        </Pressable>
        <View style={styles.assistantResponse}>
          <Text style={styles.settingLabel}>Assistant</Text>
          <Text style={styles.settingSub}>{response}</Text>
        </View>
      </>
    );
  } else if (title === 'Assistant Language') {
    const languages = ['English', 'Hindi', 'Hinglish'];
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>文</Text>
            <Text style={styles.featureTitle}>Assistant Language</Text>
            <Text style={styles.featureText}>Choose how Mausam Assistant communicates with you.</Text>
          </>
        )}
        {languages.map((language) => (
          <Pressable
            key={language}
            style={[styles.languageRow, assistantLanguage === language && styles.selectedLanguage]}
            onPress={() => setAssistantLanguage(language)}
          >
            <Text style={styles.settingLabel}>{language}</Text>
            <Text style={styles.radioText}>{assistantLanguage === language ? '●' : '○'}</Text>
          </Pressable>
        ))}
      </>
    );
  } else if (title === 'App Settings') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>⚙️</Text>
            <Text style={styles.featureTitle}>App Settings</Text>
            <Text style={styles.featureText}>Control your Mausam experience.</Text>
          </>
        )}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Dark theme</Text><Text style={styles.settingSub}>Use a darker interface</Text></View>
          <Switch value={darkTheme} onValueChange={setDarkTheme} />
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Notifications</Text><Text style={styles.settingSub}>Weather and safety updates</Text></View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </>
    );
  } else if (title === 'Notifications') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>🔔</Text>
            <Text style={styles.featureTitle}>Notifications</Text>
            <Text style={styles.featureText}>Manage weather notification preferences.</Text>
          </>
        )}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Weather notifications</Text><Text style={styles.settingSub}>Daily weather and important changes</Text></View>
          <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Rain notifications</Text><Text style={styles.settingSub}>High rain probability</Text></View>
          <Switch value={rainAlertsEnabled} onValueChange={setRainAlertsEnabled} />
        </View>
      </>
    );
  } else if (title === 'Units (°C, km/h)') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>🌡️</Text>
            <Text style={styles.featureTitle}>Units</Text>
            <Text style={styles.featureText}>Choose temperature and wind units.</Text>
          </>
        )}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Temperature: Celsius</Text><Text style={styles.settingSub}>{useCelsius ? '°C selected' : '°F selected'}</Text></View>
          <Switch value={useCelsius} onValueChange={setUseCelsius} />
        </View>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Wind: km/h</Text><Text style={styles.settingSub}>{useKmH ? 'km/h selected' : 'mph selected'}</Text></View>
          <Switch value={useKmH} onValueChange={setUseKmH} />
        </View>
        {weather && renderCard(
          <>
            <Text style={styles.settingLabel}>Current preview</Text>
            <Text style={styles.previewValue}>{temp(weather.temperature)} · {speed(weather.windSpeed)}</Text>
          </>
        )}
      </>
    );
  } else if (title === 'Theme') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>☾</Text>
            <Text style={styles.featureTitle}>Theme</Text>
            <Text style={styles.featureText}>Switch between light and dark app appearance.</Text>
          </>
        )}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}><Text style={styles.settingLabel}>Dark theme</Text><Text style={styles.settingSub}>{darkTheme ? 'Dark' : 'Light'}</Text></View>
          <Switch value={darkTheme} onValueChange={setDarkTheme} />
        </View>
      </>
    );
  } else if (title === 'Help & Support') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>?</Text>
            <Text style={styles.featureTitle}>Help & Support</Text>
            <Text style={styles.featureText}>Quick answers for using Mausam.</Text>
          </>
        )}
        <FAQ title="How do I change location?" text="Open Search Location from the menu or use your current GPS location." />
        <FAQ title="How do I save a place?" text="Open the location and tap Save This Location." />
        <FAQ title="Where does weather come from?" text="The current frontend uses Open-Meteo weather and air-quality services." />
        <FAQ title="Can I change units?" text="Yes. Open Units from the Settings section." />
      </>
    );
  } else if (title === 'About Mausam') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>☁️</Text>
            <Text style={styles.featureTitle}>About Mausam</Text>
            <Text style={styles.featureText}>A simple, personalized weather and environment app.</Text>
          </>
        )}
        <View style={styles.aboutRow}><Text style={styles.settingLabel}>Version</Text><Text style={styles.settingSub}>Frontend Preview 1.0</Text></View>
        <View style={styles.aboutRow}><Text style={styles.settingLabel}>Platform</Text><Text style={styles.settingSub}>React Native + Expo</Text></View>
        <View style={styles.aboutRow}><Text style={styles.settingLabel}>Focus</Text><Text style={styles.settingSub}>Weather, AQI, UV, alerts and personalized insights</Text></View>
      </>
    );
  } else if (title === 'Logout') {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>⇥</Text>
            <Text style={styles.featureTitle}>Logout</Text>
            <Text style={styles.featureText}>Authentication will be connected when the backend is added.</Text>
          </>
        )}
        <Pressable style={styles.primaryButton} onPress={onHome}>
          <Text style={styles.primaryButtonText}>Return to Mausam</Text>
        </Pressable>
      </>
    );
  } else {
    content = (
      <>
        {renderCard(
          <>
            <Text style={styles.featureIcon}>☁️</Text>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureText}>This frontend module is connected and ready.</Text>
          </>
        )}
      </>
    );
  }

  return (
    <View style={styles.featureScreen}>
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.featureContent}
      >
        {content}
        <Pressable style={styles.backHomeButton} onPress={onHome}>
          <Text style={styles.backHomeText}>Back to Home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InsightRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <View style={styles.insightRow}>
      <Text style={styles.insightRowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{title}</Text>
        <Text style={styles.settingSub}>{text}</Text>
      </View>
    </View>
  );
}

function FAQ({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.faqCard}>
      <Text style={styles.settingLabel}>{title}</Text>
      <Text style={styles.settingSub}>{text}</Text>
    </View>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#DCEBFF',
  },

  skyBackground: {
    ...StyleSheet.absoluteFill,
  },

  dayBackground: {
    backgroundColor: '#DCEBFF',
  },

  nightBackground: {
    backgroundColor: '#1E2945',
  },

  safeArea: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 16,
    paddingBottom: 35,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 14,
  },

  logo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      'rgba(255,255,255,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuIcon: {
    fontSize: 22,
    color: '#53637A',
  },

  micIcon: {
    fontSize: 18,
  },

  searchBox: {
    height: 48,
    borderRadius: 24,
    backgroundColor:
      'rgba(255,255,255,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },

  searchIcon: {
    fontSize: 25,
    color: '#7C8CA3',
    marginRight: 10,
  },

  searchText: {
    color: '#8A97AA',
    fontSize: 14,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  locationIcon: {
    fontSize: 17,
    color: '#4B67A2',
  },

  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40506A',
  },

  currentLocationButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.60)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 7,
  },

  currentLocationIcon: {
    fontSize: 14,
    marginRight: 5,
  },

  currentLocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B67A2',
  },

  locationError: {
    fontSize: 10,
    color: '#8A5A5A',
    marginBottom: 6,
  },

  weatherError: {
    fontSize: 11,
    color: '#8A5A5A',
    marginBottom: 6,
  },

  weatherCard: {
    height: 350,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 15,
    marginBottom: 12,
    backgroundColor:
      'rgba(255,255,255,0.18)',
  },

  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: '#274B8B',
  },

  feelsLike: {
    fontSize: 13,
    color: '#52647C',
  },

  condition: {
    fontSize: 14,
    fontWeight: '600',
    color: '#53657C',
    marginTop: 4,
  },

  sunArea: {
    width: '100%',
    height: 180,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sunPath: {
    position: 'absolute',
    width: 260,
    height: 130,
    borderTopWidth: 2,
    borderColor:
      'rgba(238,184,63,0.65)',
    borderStyle: 'dashed',
    borderRadius: 180,
    top: 42,
  },

  sun: {
    fontSize: 62,
    marginTop: -5,
  },

  moon: {
    fontSize: 58,
    marginTop: -5,
  },

  sunTimes: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  sunLabel: {
    fontSize: 12,
    color: '#68778B',
  },

  sunTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#44536A',
  },

  sunsetPill: {
    backgroundColor:
      'rgba(255,255,255,0.85)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
  },

  sunsetText: {
    fontSize: 11,
    color: '#59687A',
    fontWeight: '600',
  },

  rightTime: {
    alignItems: 'flex-end',
  },

  quickRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },

  infoCard: {
    flex: 1,
    minHeight: 100,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    backgroundColor:
      'rgba(255,255,255,0.42)',
  },

  infoEmoji: {
    fontSize: 21,
  },

  infoTitle: {
    fontSize: 9,
    color: '#66758A',
    textAlign: 'center',
    marginTop: 3,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#31415A',
    marginTop: 3,
  },

  infoStatus: {
    fontSize: 8,
    color: '#718097',
  },

  insightCard: {
    minHeight: 100,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 14,
    flexDirection: 'row',
    backgroundColor:
      'rgba(255,255,255,0.42)',
    marginBottom: 15,
  },

  insightText: {
    flex: 1,
  },

  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#53647A',
  },

  insightMain: {
    fontSize: 13,
    fontWeight: '700',
    color: '#263852',
    marginTop: 7,
  },

  insightSub: {
    fontSize: 10,
    color: '#718096',
    marginTop: 4,
  },

  runner: {
    fontSize: 48,
    alignSelf: 'flex-end',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  dailySectionHeader: {
    marginTop: 3,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#31415A',
  },

  viewAll: {
    fontSize: 11,
    color: '#536EA6',
    fontWeight: '600',
  },

  forecastCard: {
    minHeight: 88,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent:
      'space-around',
    alignItems: 'center',
    backgroundColor:
      'rgba(255,255,255,0.42)',
    marginBottom: 15,
  },

  forecastItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 14,
  },

  activeForecast: {
    backgroundColor:
      'rgba(255,255,255,0.75)',
  },

  forecastTime: {
    fontSize: 9,
    color: '#65748A',
  },

  forecastEmoji: {
    fontSize: 21,
    marginVertical: 4,
  },

  forecastTemp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34445C',
  },

  /* DAILY FORECAST */

  dailyForecastCard: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor:
      'rgba(255,255,255,0.42)',
    marginBottom: 15,
    paddingVertical: 5,
  },

  dailyForecastItem: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor:
      'rgba(255,255,255,0.35)',
  },

  dailyDayBox: {
    width: 68,
  },

  dailyDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34445C',
  },

  dailyDate: {
    fontSize: 9,
    color: '#7A8798',
    marginTop: 2,
  },

  dailyEmoji: {
    fontSize: 25,
    width: 42,
    textAlign: 'center',
  },

  dailyTempBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    justifyContent: 'center',
  },

  dailyMax: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34445C',
  },

  dailyMin: {
    fontSize: 12,
    color: '#8A96A7',
    marginLeft: 6,
  },

  dailyRainBox: {
    flex: 1,
    alignItems: 'flex-end',
  },

  dailyRain: {
    fontSize: 9,
    color: '#536EA6',
    fontWeight: '600',
  },

  dailyUV: {
    fontSize: 9,
    color: '#7A8798',
    marginTop: 3,
  },

  dailyLoading: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dailyLoadingText: {
    fontSize: 11,
    color: '#718096',
  },

  /* ALERT */

  alertCard: {
    minHeight: 70,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    backgroundColor:
      'rgba(255,255,255,0.45)',
  },

  alertIcon: {
    fontSize: 30,
    marginRight: 12,
  },

  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34455E',
  },

  alertText: {
    fontSize: 10,
    color: '#718096',
    marginTop: 3,
  },

  arrow: {
    fontSize: 25,
    color: '#718096',
  },

  /* DRAWER */

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor:
      'rgba(15,25,45,0.25)',
  },

  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    overflow: 'hidden',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 20,
  },

  drawerBlur: {
    flex: 1,
    paddingTop: 55,
    paddingHorizontal: 15,
    backgroundColor:
      'rgba(255,255,255,0.48)',
  },

  drawerContent: {
    paddingBottom: 35,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },

  profileEmoji: {
    fontSize: 35,
    marginRight: 10,
  },

  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#30415B',
  },

  profileSub: {
    fontSize: 10,
    color: '#758196',
    marginTop: 2,
  },

  menuTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A94A5',
    marginTop: 13,
    marginBottom: 7,
    paddingHorizontal: 7,
  },

  menuItem: {
    height: 37,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    marginBottom: 4,
  },

  activeMenuItem: {
    backgroundColor:
      'rgba(255,255,255,0.85)',
  },

  menuItemIcon: {
    width: 25,
    fontSize: 17,
    color: '#667BD0',
    textAlign: 'center',
  },

  menuItemText: {
    fontSize: 12,
    color: '#506079',
    marginLeft: 7,
  },

  activeMenuText: {
    fontWeight: '700',
    color: '#344A8F',
  },

  /* STEP 8-11 FEATURE SCREENS */

  saveLocationButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 8,
  },

  saveLocationIcon: {
    fontSize: 16,
    color: '#536EA6',
    marginRight: 5,
  },

  saveLocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#536EA6',
  },

  featureScreen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  featureContent: {
    paddingBottom: 35,
  },

  featureCard: {
    minHeight: 150,
    borderRadius: 25,
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginBottom: 12,
  },

  featureIcon: {
    fontSize: 38,
    marginBottom: 8,
  },

  featureTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#274B8B',
  },

  featureText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#66758A',
    marginTop: 6,
  },

  savedLocationRow: {
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.58)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 8,
  },

  savedLocationPin: {
    fontSize: 22,
    marginRight: 10,
  },

  savedLocationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34445C',
  },

  savedLocationSub: {
    fontSize: 10,
    color: '#7A8798',
    marginTop: 2,
  },

  deleteText: {
    fontSize: 25,
    color: '#8A5A5A',
    paddingHorizontal: 7,
  },

  primaryButton: {
    minHeight: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.80)',
    marginVertical: 7,
  },

  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344A8F',
  },

  mapMock: {
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#D4E3D5',
    position: 'relative',
    marginBottom: 8,
  },

 mapGrid: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.45,
  borderWidth: 1,
  borderColor: 'rgba(70,100,80,0.18)',
},

  mapCloud: {
    position: 'absolute',
    left: 35,
    top: 35,
    fontSize: 42,
  },

  mapRain: {
    position: 'absolute',
    right: 45,
    top: 90,
    fontSize: 42,
  },

  mapSun: {
    position: 'absolute',
    left: 120,
    bottom: 55,
    fontSize: 48,
  },

  mapPin: {
    position: 'absolute',
    left: '47%',
    top: '45%',
    fontSize: 35,
  },

  mapLabel: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    fontSize: 11,
    fontWeight: '700',
    color: '#34445C',
  },

  coordinateText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#758196',
    marginBottom: 10,
  },

  layerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },

  layerChip: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 15,
    fontSize: 10,
    color: '#53647A',
  },

  insightRow: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },

  insightRowIcon: {
    fontSize: 27,
    width: 48,
    textAlign: 'center',
  },

  settingRow: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34445C',
  },

  settingSub: {
    fontSize: 10,
    lineHeight: 15,
    color: '#7A8798',
    marginTop: 3,
  },

  alertListItem: {
    minHeight: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginBottom: 8,
  },

  alertListIcon: {
    fontSize: 20,
    marginRight: 9,
  },

  alertListText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#52647C',
  },

  voiceOrb: {
    fontSize: 50,
    marginBottom: 8,
  },

  assistantInput: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.80)',
    paddingHorizontal: 15,
    color: '#34445C',
    fontSize: 12,
    marginBottom: 8,
  },

  assistantResponse: {
    minHeight: 75,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    padding: 13,
    marginTop: 4,
  },

  languageRow: {
    minHeight: 55,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 8,
  },

  selectedLanguage: {
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  radioText: {
    fontSize: 20,
    color: '#536EA6',
  },

  previewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#274B8B',
    marginTop: 6,
  },

  faqCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    padding: 14,
    marginBottom: 8,
  },

  aboutRow: {
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    padding: 14,
    marginBottom: 8,
  },

  /* SIMPLE SCREENS */

  simpleScreen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 24,
  },

  homeIcon: {
    fontSize: 20,
    color: '#53637A',
  },

  simpleCard: {
    minHeight: 260,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor:
      'rgba(255,255,255,0.38)',
  },

  simpleIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  simpleTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#274B8B',
    textAlign: 'center',
  },

  simpleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#53647A',
    textAlign: 'center',
    marginTop: 10,
  },

  simpleSubText: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    marginTop: 6,
  },

  backHomeButton: {
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor:
      'rgba(255,255,255,0.78)',
  },

  backHomeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344A8F',
  },
});