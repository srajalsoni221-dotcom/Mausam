import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

const RECENT_LOCATIONS = [
  {
    city: 'Raipur',
    state: 'Chhattisgarh',
    country: 'India',
  },
  {
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
  },
  {
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    country: 'India',
  },
  {
    city: 'Indore',
    state: 'Madhya Pradesh',
    country: 'India',
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
  },
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    country: 'India',
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
  },
];

export default function SearchLocationScreen() {
  const [searchText, setSearchText] = useState('');

  const filteredLocations = RECENT_LOCATIONS.filter((location) => {
    const search = searchText.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      location.city.toLowerCase().includes(search) ||
      location.state.toLowerCase().includes(search) ||
      location.country.toLowerCase().includes(search)
    );
  });

  const handleCurrentLocation = () => {
    Keyboard.dismiss();
    console.log('Current location selected');
  };

  const handleLocationPress = (city: string) => {
    Keyboard.dismiss();

    router.replace({
      pathname: '/',
      params: {
        city: city,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.headerButton}>
            <Text style={styles.headerButtonText}>☰</Text>
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.brandText}>MAUSAM</Text>
            <Text style={styles.headerTitle}>Search Location</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Search Card */}
        <View style={styles.searchCardWrapper}>
          <BlurView
            intensity={75}
            tint="light"
            style={styles.searchCard}
          >
            <View style={styles.searchInputContainer}>
              <View style={styles.searchIconCircle}>
                <Text style={styles.searchIcon}>⌕</Text>
              </View>

              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search city or location"
                placeholderTextColor="#8A929E"
                style={styles.searchInput}
                returnKeyType="search"
                autoCapitalize="words"
                autoCorrect={false}
                editable={true}
                keyboardType="default"
              />

              {searchText.length > 0 && (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSearchText('')}
                >
                  <Text style={styles.clearText}>×</Text>
                </Pressable>
              )}
            </View>
          </BlurView>
        </View>

        {/* Current Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR LOCATION</Text>

          <Pressable
            style={styles.currentLocationCard}
            onPress={handleCurrentLocation}
          >
            <BlurView
              intensity={65}
              tint="light"
              style={styles.glassCard}
            >
              <View style={styles.locationIconCircle}>
                <Text style={styles.locationIcon}>⌖</Text>
              </View>

              <View style={styles.locationTextContainer}>
                <Text style={styles.currentLocationTitle}>
                  Use Current Location
                </Text>

                <Text style={styles.currentLocationSubtitle}>
                  Find weather for your current position
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </BlurView>
          </Pressable>
        </View>

        {/* Recent Locations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              RECENT LOCATIONS
            </Text>

            {searchText.length > 0 && (
              <Text style={styles.resultText}>
                {filteredLocations.length} result
                {filteredLocations.length === 1 ? '' : 's'}
              </Text>
            )}
          </View>

          {filteredLocations.length > 0 ? (
            filteredLocations.map((location) => (
              <Pressable
                key={`${location.city}-${location.state}`}
                style={styles.locationCard}
                onPress={() => handleLocationPress(location.city)}
              >
                <BlurView
                  intensity={60}
                  tint="light"
                  style={styles.glassCard}
                >
                  <View style={styles.cityIconCircle}>
                    <Text style={styles.cityIcon}>⌂</Text>
                  </View>

                  <View style={styles.locationTextContainer}>
                    <Text style={styles.cityName}>
                      {location.city}
                    </Text>

                    <Text style={styles.cityDetails}>
                      {location.state}, {location.country}
                    </Text>
                  </View>

                  <Text style={styles.arrow}>›</Text>
                </BlurView>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <BlurView
                intensity={60}
                tint="light"
                style={styles.emptyCardBlur}
              >
                <Text style={styles.emptyIcon}>⌕</Text>

                <Text style={styles.emptyTitle}>
                  No location found
                </Text>

                <Text style={styles.emptySubtitle}>
                  Try searching with another city name
                </Text>
              </BlurView>
            </View>
          )}
        </View>

        {/* Popular Locations */}
        {searchText.trim().length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              POPULAR CITIES
            </Text>

            <View style={styles.popularGrid}>
              <PopularCity
                city="Bengaluru"
                state="Karnataka"
                onPress={() => handleLocationPress('Bengaluru')}
              />

              <PopularCity
                city="Hyderabad"
                state="Telangana"
                onPress={() => handleLocationPress('Hyderabad')}
              />

              <PopularCity
                city="Kolkata"
                state="West Bengal"
                onPress={() => handleLocationPress('Kolkata')}
              />

              <PopularCity
                city="Chennai"
                state="Tamil Nadu"
                onPress={() => handleLocationPress('Chennai')}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PopularCity({
  city,
  state,
  onPress,
}: {
  city: string;
  state: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.popularCard} onPress={onPress}>
      <BlurView
        intensity={60}
        tint="light"
        style={styles.popularCardBlur}
      >
        <View style={styles.popularIconCircle}>
          <Text style={styles.popularIcon}>⌖</Text>
        </View>

        <Text style={styles.popularCityName}>{city}</Text>
        <Text style={styles.popularState}>{state}</Text>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 30,
  },

  /* Header */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    marginBottom: 16,
  },

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#7B8798',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  headerButtonText: {
    fontSize: 24,
    color: '#202733',
    fontWeight: '600',
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },

  brandText: {
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: '800',
    color: '#657080',
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17202D',
  },

  headerSpacer: {
    width: 48,
  },

  /* Search */

  searchCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 28,
  },

  searchCard: {
    minHeight: 70,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#718096',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingHorizontal: 14,
  },

  searchIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91,137,205,0.10)',
    marginRight: 10,
  },

  searchIcon: {
    fontSize: 27,
    color: '#5277A8',
    transform: [{ rotate: '-20deg' }],
  },

  searchInput: {
    flex: 1,
    height: 56,
    fontSize: 16,
    fontWeight: '500',
    color: '#202733',
    paddingVertical: 0,
  },

  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40,48,60,0.08)',
    marginLeft: 8,
  },

  clearText: {
    fontSize: 22,
    lineHeight: 23,
    color: '#5D6674',
  },

  /* Sections */

  section: {
    marginBottom: 26,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#697281',
    marginBottom: 12,
  },

  resultText: {
    fontSize: 12,
    color: '#8A919D',
    marginBottom: 12,
  },

  /* Current location */

  currentLocationCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  /* Location cards */

  locationCard: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 11,
  },

  glassCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.67)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  locationIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(104,160,255,0.14)',
    marginRight: 14,
  },

  locationIcon: {
    fontSize: 27,
    color: '#4B86E8',
  },

  cityIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(130,145,165,0.12)',
    marginRight: 14,
  },

  cityIcon: {
    fontSize: 23,
    color: '#647080',
  },

  locationTextContainer: {
    flex: 1,
  },

  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2633',
    marginBottom: 4,
  },

  currentLocationSubtitle: {
    fontSize: 12,
    color: '#7A838F',
    lineHeight: 17,
  },

  cityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2633',
    marginBottom: 4,
  },

  cityDetails: {
    fontSize: 12,
    color: '#7A838F',
  },

  arrow: {
    fontSize: 30,
    color: '#89919C',
    fontWeight: '300',
    marginLeft: 8,
  },

  /* Empty */

  emptyCard: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  emptyCardBlur: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  emptyIcon: {
    fontSize: 38,
    color: '#8B939F',
    marginBottom: 8,
    transform: [{ rotate: '-20deg' }],
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303947',
    marginBottom: 5,
  },

  emptySubtitle: {
    fontSize: 12,
    color: '#818A96',
    textAlign: 'center',
  },

  /* Popular cities */

  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  popularCard: {
    width: '48.3%',
    height: 130,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
  },

  popularCardBlur: {
    flex: 1,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  popularIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(120,140,170,0.11)',
    marginBottom: 10,
  },

  popularIcon: {
    fontSize: 20,
    color: '#667282',
  },

  popularCityName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26303D',
    marginBottom: 3,
  },

  popularState: {
    fontSize: 11,
    color: '#818A96',
  },

  bottomSpace: {
    height: 40,
  },
});