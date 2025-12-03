import React, {lazy, Suspense} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type {
  MainTabParamList,
  HomeStackParamList,
  DashboardStackParamList,
  ProposalsStackParamList,
  ChatStackParamList,
  QuickServiceStackParamList,
  ProfileStackParamList,
} from '../types/navigation.types';
import {useAuth} from '../contexts/AuthContext';

// Screens
import ServicesListScreen from '../pages/services/ServicesListScreen';
import ClienteHomeScreen from '../pages/services/ClienteHomeScreen';
import ServiceDetailScreen from '../pages/services/ServiceDetailScreen';
import CreateServiceScreen from '../pages/services/CreateServiceScreen';
import ServiceProposalsScreen from '../pages/services/ServiceProposalsScreen';
import ProposalsListScreen from '../pages/services/ProposalsListScreen';
import MyProposalsScreen from '../pages/proposals/MyProposalsScreen';
import CreateProposalScreen from '../pages/proposals/CreateProposalScreen';
import ChatListScreen from '../pages/chat/ChatListScreen';
import ChatScreen from '../pages/chat/ChatScreen';
import QuickServiceHomeScreen from '../pages/quickService/QuickServiceHomeScreen';
import QuickServiceClientScreen from '../pages/quickService/QuickServiceClientScreen';
import QuickServicePrestadorScreen from '../pages/quickService/QuickServicePrestadorScreen';
import ProfileScreen from '../pages/profile/ProfileScreen';
import EditProfileScreen from '../pages/profile/EditProfileScreen';
import NotificationPreferencesScreen from '../pages/profile/NotificationPreferencesScreen';

// Lazy load dashboard screens (only load when user navigates to dashboard)
const ClienteDashboardScreen = lazy(() => import('../pages/dashboard/ClienteDashboardScreen'));
const PrestadorDashboardScreen = lazy(() => import('../pages/dashboard/PrestadorDashboardScreen'));

// Loading fallback component
const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#2196F3" />
  </View>
);

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ProposalsStack = createNativeStackNavigator<ProposalsStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const QuickServiceStack =
  createNativeStackNavigator<QuickServiceStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Home Stack Navigator
const HomeNavigator = () => {
  const {user} = useAuth();
  const isCliente = user?.roles.includes('cliente');
  
  // Clientes see their own services, prestadores see all available services
  const HomeScreen = isCliente ? ClienteHomeScreen : ServicesListScreen;
  
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="ServicesList"
        component={HomeScreen}
        options={{title: isCliente ? 'Meus Serviços' : 'Serviços Disponíveis'}}
      />
      <HomeStack.Screen
        name="ServiceDetail"
        component={ServiceDetailScreen}
        options={{title: 'Detalhes do Serviço'}}
      />
      <HomeStack.Screen
        name="CreateService"
        component={CreateServiceScreen}
        options={{title: 'Criar Serviço'}}
      />
      <HomeStack.Screen
        name="ProposalsList"
        component={ServiceProposalsScreen}
        options={{title: 'Propostas Recebidas'}}
      />
    </HomeStack.Navigator>
  );
};

// Dashboard Stack Navigator
const DashboardNavigator = () => {
  const {user} = useAuth();
  const isPrestador = user?.roles.includes('prestador');

  // Se for prestador, mostra dashboard de prestador
  // Senão, mostra dashboard de cliente
  const DashboardScreen = isPrestador
    ? PrestadorDashboardScreen
    : ClienteDashboardScreen;

  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen
        name="DashboardHome"
        options={{title: 'Dashboard'}}>
        {(props) => (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardScreen {...props} />
          </Suspense>
        )}
      </DashboardStack.Screen>
    </DashboardStack.Navigator>
  );
};

// Proposals Stack Navigator
const ProposalsNavigator = () => (
  <ProposalsStack.Navigator>
    <ProposalsStack.Screen
      name="MyProposals"
      component={ProposalsListScreen}
      options={{title: 'Propostas Aceitas'}}
    />
    <ProposalsStack.Screen
      name="CreateProposal"
      component={CreateProposalScreen}
      options={{title: 'Enviar Proposta'}}
    />
  </ProposalsStack.Navigator>
);

// Chat Stack Navigator
const ChatNavigator = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{title: 'Conversas'}}
    />
    <ChatStack.Screen
      name="Chat"
      component={ChatScreen}
      options={({route}) => ({title: route.params.otherUserName})}
    />
  </ChatStack.Navigator>
);

// Quick Service Stack Navigator
const QuickServiceNavigator = () => (
  <QuickServiceStack.Navigator>
    <QuickServiceStack.Screen
      name="QuickServiceHome"
      component={QuickServiceHomeScreen}
      options={{title: 'Serviço Rápido'}}
    />
    <QuickServiceStack.Screen
      name="QuickServiceClient"
      component={QuickServiceClientScreen}
      options={{title: 'Solicitar Serviço'}}
    />
    <QuickServiceStack.Screen
      name="QuickServicePrestador"
      component={QuickServicePrestadorScreen}
      options={{title: 'Disponibilidade'}}
    />
  </QuickServiceStack.Navigator>
);

// Profile Stack Navigator
const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{title: 'Perfil'}}
    />
    <ProfileStack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{title: 'Editar Perfil'}}
    />
    <ProfileStack.Screen
      name="NotificationPreferences"
      component={NotificationPreferencesScreen}
      options={{title: 'Relatórios Periódicos'}}
    />
  </ProfileStack.Navigator>
);

const MainNavigator: React.FC = () => {
  const {user} = useAuth();
  const isCliente = user?.roles.includes('cliente');
  const isPrestador = user?.roles.includes('prestador');

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({color, size}) => {
          let iconName = 'home';

          switch (route.name) {
            case 'HomeTab':
              iconName = 'home';
              break;
            case 'DashboardTab':
              iconName = 'dashboard';
              break;
            case 'ProposalsTab':
              iconName = 'description';
              break;
            case 'ChatTab':
              iconName = 'chat';
              break;
            case 'QuickServiceTab':
              iconName = 'flash-on';
              break;
            case 'ProfileTab':
              iconName = 'person';
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{title: 'Início'}}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardNavigator}
        options={{title: 'Dashboard'}}
      />
      {isPrestador && (
        <Tab.Screen
          name="ProposalsTab"
          component={ProposalsNavigator}
          options={{title: 'Propostas'}}
        />
      )}
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{title: 'Chat'}}
      />
      <Tab.Screen
        name="QuickServiceTab"
        component={QuickServiceNavigator}
        options={{title: 'Rápido'}}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{title: 'Perfil'}}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default MainNavigator;
