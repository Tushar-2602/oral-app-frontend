import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export const API_URL = 'http:///192.168.1.9:5000/api/v1'; // Replace with your backend URL

export const TokenService = {
  save: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
  },
  getAccess: () => SecureStore.getItemAsync('accessToken'),
  getRefresh: () => SecureStore.getItemAsync('refreshToken'),
  clear: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },
};

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); // true on mount to check tokens
  const [error, setError] = useState('');

  // On app start: validate existing tokens
  useEffect(() => {
    checkExistingTokens();
  }, []);

  const checkExistingTokens = async () => {
    try {
      console.log("entered");
      
      const accessToken = await TokenService.getAccess();
      const refreshToken = await TokenService.getRefresh();

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      // Send both tokens to backend for validation
      const res = await fetch(`${API_URL}/user/verifyJwt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken,refreshToken }),
      });
      console.log("token sent");
      const resp = await res.json();
      const data=resp.data;
      if (res.status == 200) {
        console.log(`datea ${data}`);
        // If backend returns new tokens, save them
        if (data.accessToken && data.refreshToken) {
          
          console.log("before save");

await TokenService.save(data.accessToken, data.refreshToken);

console.log("after save");
        }
        router.replace('/home');
      } else {
        // Tokens invalid — clear them, show login
        await TokenService.clear();
        setLoading(false);
      }
    } catch {
      // Network error or unexpected failure — just show login
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status == 401) {
        setError('incorrect email or password');
        return;
      }

      const resp = await res.json();
      const data=resp.data;
      console.log(data);
      

      if (res.ok && data.accessToken && data.refreshToken) {
        console.log("fff");
        await TokenService.save(data.accessToken, data.refreshToken);
        
        router.replace('/home');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Checking session...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.mainButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.mainButtonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  mainButton: {
    backgroundColor: '#000',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
  },
});