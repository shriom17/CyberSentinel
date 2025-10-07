/**
 * Mobile App Interface - React Native Components for Law Enforcement
 * Provides real-time crime alerts and incident management on mobile devices
 */
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  Platform,
  PermissionsAndroid,
  Linking
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// API Configuration
const API_BASE_URL = 'http://your-backend-url.com/api';

// Auth Context
const AuthContext = React.createContext();

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('auth_token', data.token);
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Screen
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      <View style={styles.loginContainer}>
        <Text style={styles.appTitle}>🚔 CyberCrime Mobile</Text>
        <Text style={styles.subtitle}>Law Enforcement Portal</Text>
        
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Officer Email ID"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Logging In...' : 'Login'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          Authorized Personnel Only
        </Text>
      </View>
    </View>
  );
};

// Dashboard Screen
const DashboardScreen = () => {
  const [stats, setStats] = useState({});
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    loadDashboardData();
    setupPushNotifications();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      // Load statistics
      const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData);
      
      // Load recent alerts
      const alertsResponse = await fetch(`${API_BASE_URL}/alerts/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const alertsData = await alertsResponse.json();
      setRecentAlerts(alertsData.alerts || []);
      
    } catch (error) {
      console.error('Dashboard load error:', error);
    }
  };

  const setupPushNotifications = () => {
    PushNotification.configure({
      onNotification: function(notification) {
        if (notification.userInteraction) {
          // Handle notification tap
          navigation.navigate('Alerts');
        }
      },
      requestPermissions: Platform.OS === 'ios',
    });
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <Icon name={icon} size={24} color={color} />
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const AlertItem = ({ item }) => (
    <TouchableOpacity style={styles.alertItem}>
      <View style={[styles.alertIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertSubtitle}>{item.location} • {item.time}</Text>
        <Text style={styles.alertDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[severity] || '#666';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {user?.name}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <StatCard
          title="Active Alerts"
          value={stats.active_alerts || 0}
          icon="warning"
          color="#d32f2f"
        />
        <StatCard
          title="Today's Cases"
          value={stats.todays_cases || 0}
          icon="today"
          color="#1976d2"
        />
        <StatCard
          title="Amount Recovered"
          value={`₹${(stats.amount_recovered || 0).toLocaleString()}`}
          icon="account-balance"
          color="#388e3c"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.success_rate || 0}%`}
          icon="trending-up"
          color="#ff9800"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Alerts</Text>
        {recentAlerts.length > 0 ? (
          <FlatList
            data={recentAlerts}
            renderItem={AlertItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noDataText}>No recent alerts</Text>
        )}
      </View>
    </ScrollView>
  );
};

// Map Screen
const MapScreen = () => {
  const [incidents, setIncidents] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    requestLocationPermission();
    loadMapData();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        getCurrentLocation();
      }
    } else {
      getCurrentLocation();
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  const loadMapData = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/map/incidents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      setIncidents(data.incidents || []);
      setHeatmapData(data.heatmap_data || []);
      
    } catch (error) {
      console.error('Map data load error:', error);
    }
  };

  const getMarkerColor = (severity) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[severity] || '#666';
  };

  return (
    <View style={styles.mapContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={currentLocation || {
          latitude: 28.6139,
          longitude: 77.2090,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Incident Markers */}
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude,
            }}
            pinColor={getMarkerColor(incident.severity)}
            title={incident.title}
            description={incident.description}
          />
        ))}
        
        {/* Heatmap */}
        {heatmapData.length > 0 && (
          <Heatmap
            points={heatmapData}
            radius={50}
            opacity={0.6}
          />
        )}
      </MapView>
      
      <View style={styles.mapLegend}>
        <Text style={styles.legendTitle}>Incident Severity</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#d32f2f' }]} />
            <Text style={styles.legendText}>Critical</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#fbc02d' }]} />
            <Text style={styles.legendText}>Medium</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#388e3c' }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Alerts Screen
const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/alerts?filter=${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAlerts(data.alerts || []);
      
    } catch (error) {
      console.error('Alerts load error:', error);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      
      await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      loadAlerts();
      
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const FilterButton = ({ title, value, active }) => (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.activeFilterButton]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, active && styles.activeFilterButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const AlertCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.alertCard, !item.read && styles.unreadAlert]}
      onPress={() => {
        markAsRead(item.id);
        navigation.navigate('AlertDetail', { alert: item });
      }}
    >
      <View style={styles.alertCardHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.alertTime}>{item.timestamp}</Text>
      </View>
      
      <Text style={styles.alertCardTitle}>{item.title}</Text>
      <Text style={styles.alertCardDescription}>{item.description}</Text>
      
      <View style={styles.alertCardFooter}>
        <Text style={styles.alertLocation}>📍 {item.location}</Text>
        {item.amount && (
          <Text style={styles.alertAmount}>💰 ₹{item.amount.toLocaleString()}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#d32f2f',
      high: '#ff9800',
      medium: '#fbc02d',
      low: '#388e3c'
    };
    return colors[severity] || '#666';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <FilterButton title="All" value="all" active={filter === 'all'} />
        <FilterButton title="Critical" value="critical" active={filter === 'critical'} />
        <FilterButton title="High" value="high" active={filter === 'high'} />
        <FilterButton title="Unread" value="unread" active={filter === 'unread'} />
        <FilterButton title="Today" value="today" active={filter === 'today'} />
      </ScrollView>
      
      <FlatList
        data={alerts}
        renderItem={({ item }) => <AlertCard item={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={loadAlerts} />
        }
        contentContainerStyle={styles.alertsList}
      />
    </View>
  );
};

// Profile Screen
const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const openWebDashboard = () => {
    Linking.openURL('http://your-web-dashboard-url.com');
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1976d2" />
      
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileRole}>{user?.role}</Text>
        <Text style={styles.profileDepartment}>{user?.department}</Text>
      </View>
      
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.profileOption} onPress={openWebDashboard}>
          <Icon name="dashboard" size={24} color="#1976d2" />
          <Text style={styles.profileOptionText}>Open Web Dashboard</Text>
          <Icon name="open-in-new" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="notifications" size={24} color="#1976d2" />
          <Text style={styles.profileOptionText}>Notification Settings</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="security" size={24} color="#1976d2" />
          <Text style={styles.profileOptionText}>Security Settings</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="help" size={24} color="#1976d2" />
          <Text style={styles.profileOptionText}>Help & Support</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.profileOption}>
          <Icon name="info" size={24} color="#1976d2" />
          <Text style={styles.profileOptionText}>About App</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.profileOption, styles.logoutOption]} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#d32f2f" />
          <Text style={[styles.profileOptionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Navigation Setup
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        
        if (route.name === 'Dashboard') {
          iconName = 'dashboard';
        } else if (route.name === 'Map') {
          iconName = 'map';
        } else if (route.name === 'Alerts') {
          iconName = 'warning';
        } else if (route.name === 'Profile') {
          iconName = 'person';
        }
        
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#1976d2',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="Alerts" component={AlertsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main App Component
const App = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Root App with Provider
const RootApp = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Login Styles
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1976d2',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 12,
  },
  
  // Header Styles
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 10,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  // Section Styles
  section: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 8,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  
  // Alert Styles
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  alertIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  
  // Map Styles
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Filter Styles
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#1976d2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  
  // Alert Card Styles
  alertCard: {
    backgroundColor: 'white',
    margin: 15,
    marginBottom: 10,
    borderRadius: 8,
    padding: 15,
    elevation: 2,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  alertCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  alertCardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  alertCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertLocation: {
    fontSize: 12,
    color: '#888',
  },
  alertAmount: {
    fontSize: 12,
    color: '#388e3c',
    fontWeight: 'bold',
  },
  
  // Profile Styles
  profileHeader: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  profileDepartment: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  profileSection: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 8,
    elevation: 2,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#d32f2f',
  },
  
  // General Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1976d2',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  alertsList: {
    paddingBottom: 20,
  },
});

export default RootApp;