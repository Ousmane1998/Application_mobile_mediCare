import React from 'react';
import { View, ScrollView, ViewProps, ScrollViewProps, StyleSheet } from 'react-native';

type Props = {
  scroll?: boolean;
  children: React.ReactNode;
} & (ViewProps | ScrollViewProps);

export default function PageContainer({ scroll = false, children, style, ...rest }: Props) {
  const content = (
    <View style={[styles.base, style as any]} {...(rest as ViewProps)}>
      {children}
    </View>
  );

  if (!scroll) return content;

  return (
    <ScrollView contentContainerStyle={[styles.base, style as any]} {...(rest as ScrollViewProps)}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#fff',
    marginTop: 40,
    marginBottom: 40,
    flexGrow: 1,
  },
});
