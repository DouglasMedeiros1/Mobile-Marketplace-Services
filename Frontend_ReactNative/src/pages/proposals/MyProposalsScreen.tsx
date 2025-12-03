import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const MyProposalsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Proposals Screen - Under Construction</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  text: {fontSize: 16, color: '#666'},
});

export default MyProposalsScreen;
