import {useState, useCallback} from 'react';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  location: LocationCoords | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  hasPermission: boolean;
}

/**
 * Custom hook for managing device location
 * Handles permissions and GPS coordinates retrieval
 */
export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  /**
   * Request location permissions based on platform
   */
  const requestPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão de Localização',
            message: 'Este app precisa acessar sua localização para encontrar prestadores próximos',
            buttonNeutral: 'Perguntar Depois',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          return true;
        } else {
          setHasPermission(false);
          Alert.alert(
            'Permissão Negada',
            'Para usar esta funcionalidade, você precisa permitir o acesso à localização.',
          );
          return false;
        }
      } else {
        // iOS
        const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        const result = await check(permission);

        if (result === RESULTS.GRANTED) {
          setHasPermission(true);
          return true;
        }

        if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          if (requestResult === RESULTS.GRANTED) {
            setHasPermission(true);
            return true;
          }
        }

        if (result === RESULTS.BLOCKED) {
          Alert.alert(
            'Permissão Bloqueada',
            'A permissão de localização está bloqueada. Por favor, habilite nas configurações do dispositivo.',
          );
        }

        setHasPermission(false);
        return false;
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setHasPermission(false);
      return false;
    }
  };

  /**
   * Get current device location
   */
  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Request permission first
      const permitted = await requestPermission();
      if (!permitted) {
        setLoading(false);
        setError('Permissão de localização negada');
        return;
      }

      // Get current position
      Geolocation.getCurrentPosition(
        position => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLocation(coords);
          setLoading(false);
          console.log('📍 Location obtained:', coords);
        },
        err => {
          console.error('Error getting location:', err);
          setLoading(false);
          
          let errorMessage = 'Não foi possível obter sua localização';
          
          switch (err.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Permissão de localização negada';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Localização indisponível. Verifique se o GPS está ativo';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Tempo esgotado ao obter localização. Tente novamente';
              break;
          }
          
          setError(errorMessage);
          Alert.alert('Erro de Localização', errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          showLocationDialog: true,
        },
      );
    } catch (err) {
      console.error('Error in requestLocation:', err);
      setLoading(false);
      setError('Erro ao obter localização');
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    }
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
    hasPermission,
  };
};
