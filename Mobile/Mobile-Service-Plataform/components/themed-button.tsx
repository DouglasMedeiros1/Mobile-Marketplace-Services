import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export function ThemedButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
      <ThemedText type="defaultSemiBold" style={{ textAlign: 'center' }}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});


