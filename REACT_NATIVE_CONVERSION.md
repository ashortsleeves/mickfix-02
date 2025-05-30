# Converting MickFix to React Native

This document outlines the process of converting the MickFix web application to a React Native mobile app.

## 1. Project Setup

### Initial Setup
```bash
# Create new React Native project
npx react-native init MickFixMobile --template react-native-template-typescript

# Install necessary dependencies
npm install react-native-image-picker react-native-fs react-native-image-resizer @react-native-async-storage/async-storage
```

### Project Structure
```
MickFixMobile/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Analysis.tsx
│   │   └── ImagePicker.tsx    # Replaces ImageUpload
│   ├── services/
│   │   └── api.ts            # OpenAI API integration
│   ├── utils/
│   │   └── imageProcessing.ts # Image compression & processing
│   └── App.tsx
├── android/
├── ios/
└── package.json
```

## 2. Component Conversion Guide

### App.tsx
```typescript
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import ImagePicker from './components/ImagePicker';
import Analysis from './components/Analysis';
import Header from './components/Header';

interface AnalysisResult {
  summary: string;
  tools: string[];
  steps: string[];
}

const App = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Header />
        <View style={styles.body}>
          <ImagePicker
            onImageSelected={handleImageSelect}
            isAnalyzing={isAnalyzing}
          />
          {analysisResult && (
            <Analysis result={analysisResult} imageUri={imageUri} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  body: {
    padding: 16,
  },
});
```

### ImagePicker Component
```typescript
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

interface ImagePickerProps {
  onImageSelected: (uri: string) => void;
  isAnalyzing: boolean;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ onImageSelected, isAnalyzing }) => {
  const selectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    });

    if (result.assets && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    });

    if (result.assets && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={selectImage}
        disabled={isAnalyzing}
      >
        <Text style={styles.buttonText}>Choose from Gallery</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.button} 
        onPress={takePhoto}
        disabled={isAnalyzing}
      >
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## 3. API Integration

### api.ts
```typescript
import RNFS from 'react-native-fs';

export const analyzeImage = async (imageUri: string) => {
  const base64Image = await RNFS.readFile(imageUri, 'base64');
  
  try {
    const response = await fetch('your-api-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64Image}`
      })
    });

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

## 4. Mobile-Specific Features

### Local Storage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveAnalysis = async (result: AnalysisResult) => {
  try {
    const savedAnalyses = await AsyncStorage.getItem('analyses');
    const analyses = savedAnalyses ? JSON.parse(savedAnalyses) : [];
    analyses.push({
      ...result,
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem('analyses', JSON.stringify(analyses));
  } catch (error) {
    console.error('Error saving analysis:', error);
  }
};
```

## 5. Android Configuration

### Permissions
Add these to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## 6. Testing

### Unit Testing
```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('ImagePicker', () => {
  it('should handle image selection', async () => {
    const onImageSelected = jest.fn();
    const { getByText } = render(
      <ImagePicker onImageSelected={onImageSelected} isAnalyzing={false} />
    );

    fireEvent.press(getByText('Choose from Gallery'));
    // Add assertions
  });
});
```

## 7. Build & Deployment

### Android Build Steps
1. Generate signing key:
```bash
keytool -genkey -v -keystore mickfix.keystore -alias mickfix -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android/app/build.gradle`

3. Build release version:
```bash
cd android
./gradlew assembleRelease
```

## 8. Performance Optimization Tips

1. Use React Native's FlatList for long lists
2. Implement proper image caching
3. Use proper loading states
4. Minimize bridge crossing
5. Use proper error boundaries

## 9. Next Steps

1. Implement user authentication
2. Add offline support
3. Implement push notifications
4. Add analytics tracking
5. Implement deep linking
6. Add crash reporting

## 10. Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Native Image Picker](https://github.com/react-native-image-picker/react-native-image-picker)
- [React Native File System](https://github.com/itinance/react-native-fs)
- [React Native Async Storage](https://react-native-async-storage.github.io/async-storage/) 