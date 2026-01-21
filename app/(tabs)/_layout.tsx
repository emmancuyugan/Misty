import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Modal,
  Pressable,
  Image,
  Switch,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export default function App() {
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === 'dark';

  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [showDanger, setShowDanger] = useState(false);
  const [dangerLevel, setDangerLevel] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [region, setRegion] = useState({
    latitude: 14.6258,
    longitude: 121.0617,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [isHeatIndexWarningEnabled, setIsHeatIndexWarningEnabled] = useState(true); // Toggle for Heat Index Warning

  const opacity = useSharedValue(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 1000 }, (finished) => {
        if (finished) runOnJS(setShowSplash)(false);
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getWeather = async (cityName) => {
    setError(null);
    setWeather(null);
    try {
      const response = await axios.get(`http://192.168.254.114:5000/api/weather?city=${cityName}`);
      setWeather(response.data);

      const feels = response.data.main.feels_like;
      if (feels < 27) {
        setDangerLevel('not_hazardous');
      } else if (feels < 33) {
        setDangerLevel('caution');
      } else if (feels < 42) {
        setDangerLevel('extreme_caution');
      } else if (feels < 52) {
        setDangerLevel('danger');
      } else {
        setDangerLevel('extreme_danger');
      }
      setShowDanger(true);
    } catch (err) {
      setError('Could not fetch weather data. Please try again.');
    }
  };

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setRegion({ ...region, latitude, longitude });

    try {
      const geoRes = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=1c95382a118a44eabeff650a4b547dc8`
      );
      const components = geoRes.data.results[0].components;
      const cityName = components.city || components.town || components.village;

      if (cityName) {
        getWeather(cityName);
      } else {
        setError('Could not determine city name at this location.');
      }
    } catch (err) {
      setError('Failed to get location data.');
    }
  };

  const dangerLevels = {
    not_hazardous: {
      message: 'Not Hazardous: The weather is comfortable and safe. No heat-related risks.',
      bgColor: '#e6e6e6',
    },
    caution: {
      message: 'Caution: The heat index is rising. Stay hydrated and take breaks if you are outdoors.',
      bgColor: '#ffff00',
    },
    extreme_caution: {
      message: 'Extreme Caution: Heat levels are high. Limit your exposure to the sun and take precautions to stay cool.',
      bgColor: '#ffcc00',
    },
    danger: {
      message: 'Danger: Dangerous heat conditions are present. Avoid prolonged outdoor activities, especially in direct sunlight',
      bgColor: '#ff6600',
    },
    extreme_danger: {
      message: 'Extreme Danger: Extreme heat warning! Stay indoors and avoid any strenuous activity. This can lead to heat exhaustion or heatstroke.',
      bgColor: '#cc0001',
    },
  };

  const dangerMessage = dangerLevels[dangerLevel]?.message;
  const dangerBgColor = dangerLevels[dangerLevel]?.bgColor;

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, animatedStyle, darkMode && styles.darkBg]}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} />
        <Text style={[styles.splashTitle, darkMode && styles.darkText]}>MISTY</Text>
        <Text style={[styles.splashSubtitle, darkMode && styles.darkText]}>
          A Mobile-Based Heat Index Recommendation Application
        </Text>
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, darkMode && styles.darkBg]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Image source={require('@/assets/logo.png')} style={styles.headerLogo} />
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, darkMode && styles.darkText]}>
              Heat Index Warning:
            </Text>
            <Switch
              value={isHeatIndexWarningEnabled}
              onValueChange={setIsHeatIndexWarningEnabled}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isHeatIndexWarningEnabled ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        <MapView style={styles.map} region={region} onPress={handleMapPress}>
          <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
        </MapView>

        {error && <Text style={styles.error}>{error}</Text>}

        {weather && (
          <View style={[styles.resultContainer, darkMode && styles.darkCard]}>
            <Text style={[styles.city, darkMode && styles.darkText]}>{weather.name}</Text>
            <Text style={styles.temp}>{`${weather.main.temp}°C`}</Text>
            <Text style={[styles.description, darkMode && styles.darkText]}>
              {weather.weather[0]?.description}
            </Text>
            <View style={styles.details}>
              <Text style={darkMode && styles.darkText}>{`Heat Index: ${weather.main.feels_like}°C`}</Text>
              <Text style={darkMode && styles.darkText}>{`Min Temp: ${weather.main.temp_min}°C`}</Text>
              <Text style={darkMode && styles.darkText}>{`Max Temp: ${weather.main.temp_max}°C`}</Text>
              <Text style={darkMode && styles.darkText}>{`Humidity: ${weather.main.humidity}%`}</Text>
              <Text style={darkMode && styles.darkText}>{`Pressure: ${weather.main.pressure} hPa`}</Text>
              <Text style={darkMode && styles.darkText}>{`Visibility: ${weather.visibility / 1000} km`}</Text>
              <Text style={darkMode && styles.darkText}>{`Wind Speed: ${weather.wind.speed} m/s`}</Text>
            </View>
          </View>
        )}
      </View>

      <Modal visible={showDanger && isHeatIndexWarningEnabled} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: dangerBgColor }]}>
            <Text style={styles.title}>{dangerMessage?.split(':')[0]}</Text>
            <Text style={styles.text}>{dangerMessage?.split(':').slice(1).join(':')}</Text>
            <Pressable onPress={() => setShowDanger(false)} style={styles.button}>
              <Text style={styles.buttonText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0F2F1' },
  darkBg: { backgroundColor: '#121212' },
  inner: { padding: 24, alignItems: 'center', paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 5,
    paddingBottom: 10,
  },
  headerLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleText: {
    marginRight: 10,
    fontSize: 16,
  },
  map: { width: '100%', height: 300, marginBottom: 20, borderRadius: 12 },
  resultContainer: {
    width: '100%',
    backgroundColor: '#ffffffcc',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  darkCard: { backgroundColor: '#1e1e1e' },
  city: { fontSize: 24, fontWeight: 'bold', color: '#00796B', marginBottom: 5 },
  temp: { fontSize: 32, fontWeight: 'bold', color: '#D84315' },
  description: { fontSize: 18, fontStyle: 'italic', marginBottom: 15, textTransform: 'capitalize' },
  details: { marginTop: 10, gap: 6 },
  error: { color: 'red', marginTop: 10 },
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    borderRadius: 12,
    padding: 24,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  button: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#000',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00796B',
    marginBottom: 10,
  },
  splashSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#004D40',
    paddingHorizontal: 20,
  },
  darkText: { color: '#FFF' },
});
