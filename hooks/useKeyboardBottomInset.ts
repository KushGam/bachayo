import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Bottom inset equal to the soft keyboard height.
 * Needed on Android (Expo 54 edge-to-edge) where window resize often fails,
 * and inside Modals on both platforms.
 */
export function useKeyboardBottomInset() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
