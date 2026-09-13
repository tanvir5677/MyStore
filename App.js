/**
 * ============================================================================
 * SECTOR 1: IMPORTS & DEPENDENCIES (UPDATED WITH ANIMATION TOOLS)
 * ============================================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
  Pressable
} from 'react-native';

import { initializeApp } from "firebase/app";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Updates from 'expo-updates';

const { width } = Dimensions.get('window');

// ============================================================================
// FIREBASE CONFIG
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyC45jCX-bDfjNjlHhbfsdQ9Zomx951Q70o",
  authDomain: "mystore-714e3.firebaseapp.com",
  databaseURL: "https://mystore-714e3-default-rtdb.firebaseio.com",
  projectId: "mystore-714e3",
  storageBucket: "mystore-714e3.firebasestorage.app",
  messagingSenderId: "817536444336",
  appId: "1:817536444336:web:0789dd620dc145de735875"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

// ============================================================================
// ANIMATION HELPERS
// ============================================================================
const createStaggerAnimation = (index, totalCount) => {
  const staggerDelay = 30;
  return index * staggerDelay;
};

const triggerButtonPressAnimation = (scaleRef, pressAnim) => {
  Animated.sequence([
    Animated.parallel([
      Animated.timing(scaleRef, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]),
    Animated.parallel([
      Animated.timing(scaleRef, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(pressAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ])
  ]).start();
};

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  // Password Reset / Forgot States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [shopName, setShopName] = useState('My Store');
  const [shopLogo, setShopLogo] = useState('https://images.unsplash.com/photo-1472851294608-062f824d29cc');
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Status Animation Popup State (Success Tick / Error Cross)
  const [statusPopup, setStatusPopup] = useState({ visible: false, type: 'success', text: '' });
  const statusAnim = useRef(new Animated.Value(0)).current;

  const centerPopupAnim = useRef(new Animated.Value(0)).current;
  const [centerPopupData, setCenterPopupData] = useState({ visible: false, type: 'success', text: '' });

  // SPLASH SCREEN ANIMATIONS
  const splashScale = useRef(new Animated.Value(0.4)).current;
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const splashRotate = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  // FORM ANIMATIONS
  const formHeightAnim = useRef(new Animated.Value(0)).current;
  const formOpacityAnim = useRef(new Animated.Value(0)).current;

  // PRODUCT CARDS ANIMATIONS
  const productCardAnims = useRef({}).current;
  const buttonPressAnims = useRef({}).current;
  const buttonScaleAnims = useRef({}).current;
  const searchFocusAnim = useRef(new Animated.Value(0)).current;
  const modalSlideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: '',
    description: ''
  });

  const showStatusPopupMessage = (type, text) => {
    setStatusPopup({ visible: true, type, text });
    statusAnim.setValue(0);
    Animated.spring(statusAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(statusAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setStatusPopup({ visible: false, type: 'success', text: '' });
      });
    }, 2200);
  };

  const initializeProductAnimation = (productId) => {
    if (!productCardAnims[productId]) {
      productCardAnims[productId] = {
        scale: new Animated.Value(0.8),
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(20)
      };
    }
    return productCardAnims[productId];
  };

  const initializeButtonAnimation = (buttonId) => {
    if (!buttonPressAnims[buttonId]) {
      buttonPressAnims[buttonId] = new Animated.Value(0);
      buttonScaleAnims[buttonId] = new Animated.Value(1);
    }
    return { press: buttonPressAnims[buttonId], scale: buttonScaleAnims[buttonId] };
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(splashScale, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }),
      Animated.timing(splashOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(splashRotate, { toValue: 1, duration: 1200, useNativeDriver: true })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1, duration: 800, useNativeDriver: true })
      ])
    ).start();

    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start(() => {
        setShowSplash(false);
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, [isLoggedIn]);

  useEffect(() => {
    if (showForm) {
      Animated.parallel([
        Animated.timing(formHeightAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
        Animated.timing(formOpacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(formHeightAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(formOpacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [showForm]);

  useEffect(() => {
    products.forEach((product, index) => {
      const anim = initializeProductAnimation(product.id);
      const delay = createStaggerAnimation(index, products.length);

      setTimeout(() => {
        Animated.parallel([
          Animated.spring(anim.scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(anim.translateY, { toValue: 0, friction: 6, tension: 60, useNativeDriver: true })
        ]).start();
      }, delay);
    });
  }, [products]);

  useEffect(() => {
    if (showProfileModal || showResetModal) {
      Animated.timing(modalSlideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    } else {
      Animated.timing(modalSlideAnim, { toValue: Dimensions.get('window').height, duration: 300, useNativeDriver: true }).start();
    }
  }, [showProfileModal, showResetModal]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
          await fetchShopData(currentUser.uid);
          await fetchProducts(currentUser.uid);
          requestPermissionsAndLocation();
          checkForAppUpdate();
        } else {
          setUser(null);
          setIsLoggedIn(false);
          setProducts([]);
        }
      } catch (error) {
        console.log("Auth state error: ", error);
      } finally {
        if (initializing) setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleAuthAction = async (isSignup = false) => {
    if (!email || !password) {
      showStatusPopupMessage('error', 'দয়া করে ইমেইল এবং পাসওয়ার্ড দিন!');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(userCredential.user);
        showStatusPopupMessage('success', 'Account Created Successfully! ✔️');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        showStatusPopupMessage('success', 'Login Successful! ✔️');
      }
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showStatusPopupMessage('error', 'Already Account Created! এই জিমেইল দিয়ে ইতিপূর্বে অ্যাকাউন্ট খোলা হয়েছে। ❌');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        showStatusPopupMessage('error', 'পাসওয়ার্ড বা ইমেইল ভুল রয়েছে! ❌');
      } else {
        showStatusPopupMessage('error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!resetEmail) {
      showStatusPopupMessage('error', 'দয়া করে আপনার রেজিস্টার্ড ইমেইলটি দিন');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      showStatusPopupMessage('success', 'পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে! ✔️');
      setShowResetModal(false);
    } catch (error) {
      showStatusPopupMessage('error', 'ইমেইলটি সঠিক নয় বা রেজিস্টার্ড নয়! ❌');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Logout error: ", error);
    }
  };

  const fetchShopData = async (uid) => {
    try {
      const docRef = doc(db, "shopSettings", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.shopName) setShopName(data.shopName);
        if (data.shopLogo) setShopLogo(data.shopLogo);
      }
    } catch (error) {
      console.log("Error fetching shop data:", error);
    }
  };

  const saveShopDataToCloud = async (updatedName, updatedLogo) => {
    if (!user) return;
    try {
      const docRef = doc(db, "shopSettings", user.uid);
      await setDoc(docRef, { shopName: updatedName, shopLogo: updatedLogo }, { merge: true });
    } catch (error) {
      console.log("Error saving shop data:", error);
    }
  };

  const handleShopNameChange = (newName) => {
    setShopName(newName);
    saveShopDataToCloud(newName, shopLogo);
  };

  const handleShopLogoChange = (newLogoUri) => {
    setShopLogo(newLogoUri);
    saveShopDataToCloud(shopName, newLogoUri);
  };

  const requestPermissionsAndLocation = async () => {
    try {
      let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
      }
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    } catch (error) {
      console.log("Permission error: ", error);
    }
  };

  const checkForAppUpdate = async () => {
    try {
      if (__DEV__) return;
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          "🚀 নতুন আপডেট উপলব্ধ!",
          "আপনি কি এখনই আপডেট করতে চান?",
          [
            { text: "পরে করব", style: "cancel" },
            {
              text: "এখনই আপডেট করুন",
              onPress: async () => {
                try {
                  setLoading(true);
                  await Updates.fetchUpdateAsync();
                  Alert.alert("সফল", "আপডেট সম্পন্ন হয়েছে!", [{ text: "রিস্টার্ট", onPress: () => Updates.reloadAsync() }]);
                } catch (e) {
                  Alert.alert("ত্রুটি", "আপডেট করা যায়নি।");
                } finally {
                  setLoading(false);
                }
              }
            }
          ]
        );
      }
    } catch (e) {}
  };

  const pickImage = async (type = 'product') => {
    Alert.alert("ছবি যুক্ত করুন", "কোথা থেকে ছবি নিতে চান?", [
      {
        text: "ক্যামেরা",
        onPress: async () => {
          let result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.8 });
          if (!result.canceled && result.assets?.[0]) {
            if (type === 'shop') handleShopLogoChange(result.assets[0].uri);
            else setFormData(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
          }
        }
      },
      {
        text: "গ্যালারি",
        onPress: async () => {
          let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
          if (!result.canceled && result.assets?.[0]) {
            if (type === 'shop') handleShopLogoChange(result.assets[0].uri);
            else setFormData(prev => ({ ...prev, imageUrl: result.assets[0].uri }));
          }
        }
      },
      { text: "বাতিল", style: "cancel" }
    ]);
  };

  const fetchProducts = async (uid) => {
    try {
      const q = query(collection(db, "products"), where("userId", "==", uid));
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setProducts(list);
    } catch (error) {
      console.error("Error fetching products: ", error);
    }
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.price) {
      showStatusPopupMessage('error', 'পণ্যের নাম ও দাম দিন!');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        userId: user.uid,
        name: formData.name.trim(),
        price: formData.price.trim(),
        category: formData.category ? formData.category.trim() : 'General',
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
        description: formData.description ? formData.description.trim() : '',
        createdAt: Date.now()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        setEditingId(null);
        showCenterPopup('success', 'পণ্য সফলভাবে আপডেট হয়েছে!');
      } else {
        await addDoc(collection(db, "products"), productData);
        showCenterPopup('success', 'নতুন পণ্য যোগ হয়েছে!');
      }

      setFormData({ name: '', price: '', category: '', imageUrl: '', description: '' });
      setShowForm(false);
      await fetchProducts(user.uid);
    } catch (error) {
      showStatusPopupMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      description: product.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    Alert.alert('নিশ্চিত করুন', 'আপনি কি ডিলিট করতে চান?', [
      { text: 'বাতিল', style: 'cancel' },
      {
        text: 'ডিলিট',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "products", id));
            await fetchProducts(user.uid);
            showCenterPopup('error', 'পণ্য ডিলিট করা হয়েছে!');
          } catch (error) {
            Alert.alert('ত্রুটি', error.message);
          }
        }
      }
    ]);
  };

  const filteredProducts = products.filter(p =>
    p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showCenterPopup = (type, text) => {
    setCenterPopupData({ visible: true, type, text });
    centerPopupAnim.setValue(0);
    Animated.spring(centerPopupAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();

    setTimeout(() => {
      Animated.timing(centerPopupAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setCenterPopupData({ visible: false, type: 'success', text: '' });
      });
    }, 1500);
  };

  if (showSplash) {
    const spin = splashRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
      <View style={styles.splashContainer}>
        <Animated.View style={[styles.splashCard, { opacity: splashOpacity, transform: [{ scale: splashScale }] }]}>
          <Animated.View style={[styles.splashLogoRing, { transform: [{ rotate: spin }] }]}>
            <View style={styles.ringDot} />
          </Animated.View>
          <Animated.View style={[styles.splashLogoContainer, { transform: [{ scale: logoPulse }] }]}>
            <Image source={{ uri: shopLogo }} style={styles.splashLogoImage} />
          </Animated.View>
          <Text style={styles.splashTitle}>{shopName}</Text>
          <Text style={styles.splashSubtitle}>ULTIMATE E-COMMERCE SUITE</Text>
        </Animated.View>
      </View>
    );
  }

  if (initializing) {
    return (
      <View style={styles.initializingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginMainContainer}>
        {/* Status Animation Popup Overlay for Signup/Login Success or Errors */}
        {statusPopup.visible && (
          <View style={styles.centerPopupOverlay}>
            <Animated.View style={[styles.centerPopupBox, { transform: [{ scale: statusAnim }] }]}>
              <Text style={styles.centerPopupIcon}>{statusPopup.type === 'success' ? '✅' : '❌'}</Text>
              <Text style={[styles.centerPopupText, { color: statusPopup.type === 'success' ? '#34d399' : '#ef4444' }]}>
                {statusPopup.text}
              </Text>
            </Animated.View>
          </View>
        )}

        <Animated.View style={[styles.loginCardPremium, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.loginHeaderGlow}>
            <View style={styles.logoCircleContainer}>
              <Image source={{ uri: shopLogo }} style={{ width: 45, height: 45, borderRadius: 22.5 }} />
            </View>
            <Text style={styles.title}>{shopName}</Text>
            <Text style={styles.loginSubText}>আপনার প্রফেশনাল শপ ম্যানেজমেন্ট প্ল্যাটফর্ম</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              placeholder="আপনার ইমেইল অ্যাড্রেস"
              style={styles.inputWithIcon}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              placeholder="সিকিউর পাসওয়ার্ড দিন"
              style={styles.inputWithIcon}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#94a3b8"
            />
          </View>

          <TouchableOpacity onPress={() => setShowResetModal(true)} style={{alignItems: 'flex-end', marginBottom: 12}}>
            <Text style={{color: '#818cf8', fontSize: 13, fontWeight: 'bold'}}>পাসওয়ার্ড ভুলে গেছেন?</Text>
          </TouchableOpacity>

          <Pressable
            onPress={() => handleAuthAction(false)}
            onPressIn={() => {
              const anims = initializeButtonAnimation('login');
              triggerButtonPressAnimation(anims.scale, anims.press);
            }}
          >
            <Animated.View style={[styles.primaryButtonGradient, { transform: [{ scale: buttonScaleAnims['login'] || 1 }] }]}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>প্রবেশ করুন (Login)</Text>}
            </Animated.View>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>অথবা</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={() => handleAuthAction(true)}
            onPressIn={() => {
              const anims = initializeButtonAnimation('signup');
              triggerButtonPressAnimation(anims.scale, anims.press);
            }}
          >
            <Animated.View style={[styles.secondaryButtonOutline, { transform: [{ scale: buttonScaleAnims['signup'] || 1 }] }]}>
              <Text style={styles.secondaryButtonText}>নতুন অ্যাকাউন্ট তৈরি করুন</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>

        {showResetModal && (
          <Animated.View style={[styles.profileModalOverlay, { transform: [{ translateY: modalSlideAnim }] }]}>
            <View style={styles.profileModalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>পাসওয়ার্ড রিসেট</Text>
                <TouchableOpacity style={styles.crossIconButton} onPress={() => setShowResetModal(false)}>
                  <Text style={styles.crossIconText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{paddingBottom: 10}} showsVerticalScrollIndicator={false}>
                <Text style={{color: '#94a3b8', fontSize: 13, marginBottom: 16}}>
                  আপনার রেজিস্টার্ড ইমেইল দিন। আমরা পাসওয়ার্ড রিসেট লিঙ্ক পাঠিয়ে দেব।
                </Text>

                <TextInput
                  style={[styles.input, {marginBottom: 15}]}
                  placeholder="আপনার ইমেইল দিন"
                  placeholderTextColor="#94a3b8"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                />

                <View style={{flexDirection: 'row', gap: 12}}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setShowResetModal(false)}>
                    <Text style={styles.cancelButtonText}>বাতিল</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handlePasswordResetRequest}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>লিঙ্ক পাঠান</Text>}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.dashboardContainer}>
      {centerPopupData.visible && (
        <View style={styles.centerPopupOverlay}>
          <Animated.View style={[styles.centerPopupBox, { transform: [{ scale: centerPopupAnim }] }]}>
            <Text style={styles.centerPopupIcon}>{centerPopupData.type === 'success' ? '✨' : '⚠️'}</Text>
            <Text style={styles.centerPopupText}>{centerPopupData.text}</Text>
          </Animated.View>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: shopLogo }} style={styles.shopLogo} />
          <View style={{marginLeft: 12, flex: 1}}>
            <Text style={styles.headerTitle} numberOfLines={1}>{shopName}</Text>
            <Text style={styles.headerSubtitleText}>🟢 লাইভ ও প্রফেশনাল মোড</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowProfileModal(true)}
          onPressIn={() => {
            const anims = initializeButtonAnimation('settings');
            triggerButtonPressAnimation(anims.scale, anims.press);
          }}
        >
          <Animated.View style={[styles.profileBadgeBtn, { transform: [{ scale: buttonScaleAnims['settings'] || 1 }] }]}>
            <Text style={styles.profileBadgeText}>⚙️ সেটিংস</Text>
          </Animated.View>
        </Pressable>
      </View>

      {showProfileModal && (
        <Animated.View style={[styles.profileModalOverlay, { transform: [{ translateY: modalSlideAnim }] }]}>
          <View style={styles.profileModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>প্রোফাইল ও শপ সেটিংস</Text>
              <TouchableOpacity style={styles.crossIconButton} onPress={() => setShowProfileModal(false)}>
                <Text style={styles.crossIconText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={{alignItems: 'center', paddingBottom: 10}} showsVerticalScrollIndicator={false}>
              <View style={styles.modalProfileSection}>
                <TouchableOpacity onPress={() => pickImage('shop')}>
                  <Image source={{ uri: shopLogo }} style={styles.modalShopLogo} />
                  <View style={styles.editBadgeCircle}>
                    <Text style={{fontSize: 10}}>✏️</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.changePhotoText}>লোগো পরিবর্তন করুন</Text>

                <View style={{width: '100%', marginTop: 15}}>
                  <Text style={styles.modalEmailLabel}>শপের নাম:</Text>
                  <TextInput
                    style={styles.modalShopNameInput}
                    value={shopName}
                    onChangeText={handleShopNameChange}
                  />
                </View>
              </View>

              <View style={styles.emailBox}>
                <Text style={styles.modalEmailLabel}>লগইন করা অ্যাকাউন্ট:</Text>
                <Text style={styles.modalEmailText}>{user?.email}</Text>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.logoutModalBtn} onPress={handleLogout}>
                  <Text style={styles.logoutModalBtnText}>লগআউট করুন</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.versionText}>My Store Ultimate Edition: v1.0.4</Text>
              
              <TouchableOpacity 
                style={styles.telegramButton} 
                onPress={() => Linking.openURL('https://t.me/+6qK8oSH0yvc4M2Vl').catch(() => {})}
              >
                <Text style={styles.telegramButtonText}>📢 Join Telegram Group</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.creditButton} 
                onPress={() => Linking.openURL('https://www.facebook.com/share/1DtQhuxpcT/').catch(() => {})}
              >
                <Text style={styles.creditButtonText}>👨‍💻 Developed by Tanvir (Facebook)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsBanner}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{products.length}</Text>
            <Text style={styles.statLabel}>মোট পণ্য</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>Active</Text>
            <Text style={styles.statLabel}>স্ট্যাটাস</Text>
          </View>
        </View>

        <View style={styles.searchAddRow}>
          <Animated.View style={[styles.searchContainerCustom, { borderColor: searchFocusAnim.interpolate({ inputRange: [0, 1], outputRange: ['#334155', '#6366f1'] }) }]}>
            <Text style={styles.searchIconSymbol}>🔍</Text>
            <TextInput
              style={styles.searchInputCustom}
              placeholder="আপনার পণ্য খুঁজুন..."
              placeholderTextColor="#94a3b8"
              value={searchTerm}
              onChangeText={setSearchTerm}
              onFocus={() => Animated.timing(searchFocusAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()}
              onBlur={() => Animated.timing(searchFocusAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()}
            />
          </Animated.View>
          <Pressable
            onPress={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', price: '', category: '', imageUrl: '', description: '' });
            }}
            onPressIn={() => {
              const anims = initializeButtonAnimation('addBtn');
              triggerButtonPressAnimation(anims.scale, anims.press);
            }}
          >
            <Animated.View style={[styles.iconPlusButton, { transform: [{ scale: buttonScaleAnims['addBtn'] || 1 }] }]}>
              <Text style={styles.iconPlusText}>＋</Text>
            </Animated.View>
          </Pressable>
        </View>

        {showForm && (
          <Animated.View style={[styles.formCard, { opacity: formOpacityAnim, maxHeight: formHeightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 800] }) }]}>
            <Text style={styles.formTitle}>
              {editingId ? '✨ পণ্য আপডেট করুন' : '🚀 নতুন পণ্য যোগ করুন'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="পণ্যের নাম *"
              placeholderTextColor="#94a3b8"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="দাম (৳) *"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="বিভাগ (যেমন: ফ্যাশন, গ্যাজেট)"
              placeholderTextColor="#94a3b8"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />

            <View style={styles.imagePickerRow}>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage('product')}>
                <Text style={styles.pickerBtnText}>📸 ক্যামেরা বা গ্যালারি থেকে ছবি দিন</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="অথবা ছবির সরাসরি লিংক দিন"
              placeholderTextColor="#94a3b8"
              value={formData.imageUrl}
              onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
            />

            {formData.imageUrl ? (
              <Image source={{ uri: formData.imageUrl }} style={styles.previewImage} />
            ) : null}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="পণ্যের বিবরণ বা বিশেষ বৈশিষ্ট্য..."
              placeholderTextColor="#94a3b8"
              multiline={true}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />

            <View style={styles.formActionButtons}>
              <Pressable
                onPress={handleAddProduct}
                onPressIn={() => {
                  const anims = initializeButtonAnimation('submitBtn');
                  triggerButtonPressAnimation(anims.scale, anims.press);
                }}
              >
                <Animated.View style={[styles.submitButton, { transform: [{ scale: buttonScaleAnims['submitBtn'] || 1 }] }]}>
                  <Text style={styles.buttonText}>{editingId ? 'পরিবর্তন সংরক্ষণ করুন' : 'পণ্য তালিকাভুক্ত করুন'}</Text>
                </Animated.View>
              </Pressable>
              <Pressable
                onPress={() => setShowForm(false)}
                onPressIn={() => {
                  const anims = initializeButtonAnimation('cancelBtn');
                  triggerButtonPressAnimation(anims.scale, anims.press);
                }}
              >
                <Animated.View style={[styles.cancelButton, { transform: [{ scale: buttonScaleAnims['cancelBtn'] || 1 }] }]}>
                  <Text style={styles.cancelButtonText}>বাতিল</Text>
                </Animated.View>
              </Pressable>
            </View>
          </Animated.View>
        )}

        <View style={styles.productGrid}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>কোনো পণ্য পাওয়া যায়নি</Text>
              <Text style={styles.emptySubText}>প্লাস (+) বাটনে ক্লিক করে আপনার প্রথম পণ্যটি যুক্ত করুন</Text>
            </View>
          ) : (
            filteredProducts.map(p => {
              const anim = initializeProductAnimation(p.id);
              return (
                <Animated.View 
                  key={p.id} 
                  style={[
                    styles.productCard, 
                    { 
                      transform: [
                        { scale: anim.scale },
                        { translateY: anim.translateY }
                      ],
                      opacity: anim.opacity
                    }
                  ]}
                >
                  <Image 
                    source={{ uri: p.imageUrl || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc' }} 
                    style={styles.productImage} 
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productCategory}>{p.category || 'General'}</Text>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productPrice}>৳{p.price}</Text>

                    <View style={styles.cardActions}>
                      <Pressable 
                        onPress={() => handleEdit(p)}
                        onPressIn={() => {
                          const anims = initializeButtonAnimation(`edit-${p.id}`);
                          triggerButtonPressAnimation(anims.scale, anims.press);
                        }}
                      >
                        <Animated.View style={[styles.editBtn, { transform: [{ scale: buttonScaleAnims[`edit-${p.id}`] || 1 }] }]}>
                          <Text style={styles.actionBtnText}>এডিট</Text>
                        </Animated.View>
                      </Pressable>
                      <Pressable 
                        onPress={() => handleDelete(p.id)}
                        onPressIn={() => {
                          const anims = initializeButtonAnimation(`delete-${p.id}`);
                          triggerButtonPressAnimation(anims.scale, anims.press);
                        }}
                      >
                        <Animated.View style={[styles.deleteBtn, { transform: [{ scale: buttonScaleAnims[`delete-${p.id}`] || 1 }] }]}>
                          <Text style={styles.deleteBtnText}>ডিলিট</Text>
                        </Animated.View>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#0b0f19', justifyContent: 'center', alignItems: 'center' },
  splashCard: { alignItems: 'center', padding: 30 },
  splashLogoRing: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: 'rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRightColor: '#818cf8', justifyContent: 'center', alignItems: 'center' },
  ringDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#818cf8', position: 'absolute', top: 0 },
  splashLogoContainer: { width: 95, height: 95, borderRadius: 47.5, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 22, borderWidth: 2, borderColor: '#4f46e5', overflow: 'hidden' },
  splashLogoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  splashTitle: { fontSize: 30, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
  splashSubtitle: { fontSize: 10, color: '#94a3b8', marginTop: 6, fontWeight: '800', letterSpacing: 2.5 },

  initializingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  
  loginMainContainer: { flex: 1, justifyContent: 'center', backgroundColor: '#0f172a', padding: 20 },
  loginCardPremium: { backgroundColor: '#1e293b', padding: 28, borderRadius: 32, borderWidth: 1, borderColor: '#334155' },
  loginHeaderGlow: { alignItems: 'center', marginBottom: 25 },
  logoCircleContainer: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', marginBottom: 15, borderWidth: 1.5, borderColor: '#6366f1', overflow: 'hidden' },
  title: { fontSize: 28, fontWeight: '900', color: '#ffffff', textAlign: 'center' },
  loginSubText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4, fontWeight: '600' },
  
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 14 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  inputWithIcon: { flex: 1, paddingVertical: 15, fontSize: 14, color: '#f8fafc' },

  primaryButtonGradient: { backgroundColor: '#6366f1', padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#334155' },
  dividerText: { marginHorizontal: 12, color: '#64748b', fontSize: 12, fontWeight: '700' },
  
  secondaryButtonOutline: { backgroundColor: 'transparent', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#4f46e5' },
  secondaryButtonText: { color: '#818cf8', fontWeight: 'bold', fontSize: 14 },

  dashboardContainer: { flex: 1, backgroundColor: '#0f172a' },
  
  centerPopupOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  centerPopupBox: { backgroundColor: '#1e293b', padding: 30, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  centerPopupIcon: { fontSize: 45, marginBottom: 10 },
  centerPopupText: { fontSize: 16, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shopLogo: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: '#6366f1', backgroundColor: '#0f172a' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#f8fafc' },
  headerSubtitleText: { fontSize: 11, color: '#34d399', fontWeight: '700', marginTop: 2 },
  
  profileBadgeBtn: { backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  profileBadgeText: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold' },

  profileModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  profileModalCard: { backgroundColor: '#1e293b', width: '90%', maxHeight: '85%', padding: 22, borderRadius: 28, borderWidth: 1, borderColor: '#334155' },
  
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  crossIconButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  crossIconText: { fontSize: 16, fontWeight: 'bold', color: '#cbd5e1' },

  modalProfileSection: { alignItems: 'center', width: '100%', marginBottom: 10 },
  modalShopLogo: { width: 75, height: 75, borderRadius: 38, borderWidth: 2, borderColor: '#6366f1', backgroundColor: '#0f172a' },
  editBadgeCircle: { position: 'absolute', bottom: 0, right: '35%', backgroundColor: '#6366f1', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1e293b' },
  changePhotoText: { fontSize: 12, color: '#818cf8', marginTop: 8, fontWeight: 'bold' },
  modalShopNameInput: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc', borderWidth: 1, borderColor: '#334155', padding: 12, borderRadius: 14, marginTop: 6, backgroundColor: '#0f172a', textAlign: 'center', width: '100%' },
  
  emailBox: { width: '100%', backgroundColor: '#0f172a', padding: 12, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  modalEmailLabel: { fontSize: 12, color: '#94a3b8' },
  modalEmailText: { fontSize: 13, fontWeight: 'bold', color: '#818cf8', marginTop: 3, textAlign: 'center' },
  
  modalActionRow: { width: '100%', marginBottom: 10 },
  logoutModalBtn: { width: '100%', backgroundColor: '#ef4444', padding: 13, borderRadius: 14, alignItems: 'center' },
  logoutModalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  versionText: { fontSize: 12, color: '#64748b', fontWeight: '700', textAlign: 'center', marginTop: 6 },
  
  telegramButton: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginTop: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155', width: '100%' },
  telegramButtonText: { color: '#38bdf8', fontSize: 13, fontWeight: 'bold' },

  creditButton: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, marginTop: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155', width: '100%' },
  creditButtonText: { color: '#818cf8', fontSize: 13, fontWeight: 'bold' },

  scrollContent: { padding: 16 },

  statsBanner: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155', justifyContent: 'space-around', alignItems: 'center' },
  statBox: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 20, fontWeight: '900', color: '#6366f1' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: '70%', backgroundColor: '#334155' },
  
  searchAddRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  searchContainerCustom: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 2, borderColor: '#334155', paddingHorizontal: 14, height: 52 },
  searchIconSymbol: { fontSize: 15, marginRight: 8 },
  searchInputCustom: { flex: 1, color: '#f8fafc', fontSize: 15, height: '100%' },
  iconPlusButton: { backgroundColor: '#6366f1', width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  iconPlusText: { color: '#fff', fontSize: 26, fontWeight: 'bold', lineHeight: 28 },
  
  formCard: { backgroundColor: '#1e293b', padding: 22, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#f8fafc' },
  input: { backgroundColor: '#0f172a', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 14, color: '#f8fafc', fontSize: 14 },
  textArea: { height: 90, textAlignVertical: 'top' },
  
  imagePickerRow: { flexDirection: 'row', marginBottom: 14 },
  pickerBtn: { flex: 1, backgroundColor: '#0f172a', padding: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pickerBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: 'bold' },
  previewImage: { width: '100%', height: 150, borderRadius: 14, marginBottom: 14, resizeMode: 'cover', borderWidth: 1, borderColor: '#334155' },

  formActionButtons: { flexDirection: 'row', gap: 12, marginTop: 6 },
  submitButton: { flex: 1, backgroundColor: '#6366f1', padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { flex: 1, backgroundColor: '#0f172a', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155', justifyContent: 'center' },
  cancelButtonText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 14 },
  
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: { backgroundColor: '#1e293b', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#334155', marginBottom: 16, width: '48%' },
  productImage: { width: '100%', height: 140, resizeMode: 'cover' },
  productInfo: { padding: 12 },
  productCategory: { fontSize: 10, color: '#818cf8', fontWeight: '800', textTransform: 'uppercase' },
  productName: { fontSize: 15, fontWeight: 'bold', color: '#f8fafc', marginVertical: 3 },
  productPrice: { color: '#34d399', fontWeight: 'bold', fontSize: 15, marginBottom: 10 },
  
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, backgroundColor: '#0f172a', paddingVertical: 7, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  deleteBtn: { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 7, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  actionBtnText: { color: '#818cf8', fontSize: 12, fontWeight: 'bold' },
  deleteBtnText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  
  emptyCard: { backgroundColor: '#1e293b', padding: 45, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155', width: '100%' },
  emptyEmoji: { fontSize: 45, marginBottom: 10 },
  emptyText: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold' },
  emptySubText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 4 }
});

