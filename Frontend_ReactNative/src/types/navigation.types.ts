import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp, RouteProp} from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Home Stack
export type HomeStackParamList = {
  ServicesList: undefined;
  ServiceDetail: {serviceId: number};
  CreateService: undefined;
  ProposalsList: {serviceId: number};
};

export type HomeNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  MainTabNavigationProp
>;

// Proposals Stack
export type ProposalsStackParamList = {
  MyProposals: undefined;
  CreateProposal: {serviceId: number};
};

export type ProposalsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProposalsStackParamList>,
  MainTabNavigationProp
>;

// Chat Stack
export type ChatStackParamList = {
  ChatList: undefined;
  Chat: {otherUserId: number; otherUserName: string};
};

export type ChatNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ChatStackParamList>,
  MainTabNavigationProp
>;

// Quick Service Stack
export type QuickServiceStackParamList = {
  QuickServiceHome: undefined;
  QuickServiceClient: undefined;
  QuickServicePrestador: undefined;
};

export type QuickServiceNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<QuickServiceStackParamList>,
  MainTabNavigationProp
>;

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  NotificationPreferences: undefined;
};

export type ProfileNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  MainTabNavigationProp
>;

export type EditProfileNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

// Dashboard Stack
export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type DashboardNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<DashboardStackParamList>,
  MainTabNavigationProp
>;

// Main Tabs
export type MainTabParamList = {
  HomeTab: undefined;
  DashboardTab: undefined;
  ProposalsTab: undefined;
  ChatTab: undefined;
  QuickServiceTab: undefined;
  ProfileTab: undefined;
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Root Navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Route Props
export type ServiceDetailRouteProp = RouteProp<HomeStackParamList, 'ServiceDetail'>;
export type ProposalsListRouteProp = RouteProp<HomeStackParamList, 'ProposalsList'>;
export type CreateProposalRouteProp = RouteProp<ProposalsStackParamList, 'CreateProposal'>;
export type ChatRouteProp = RouteProp<ChatStackParamList, 'Chat'>;
