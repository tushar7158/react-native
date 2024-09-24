import React from 'react';
import tw from 'twrnc';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {useAuth} from '../auth/AuthContext';

const GoogleSignIn = () => {
  const {signOut, signIn, setUserInfo, userInfo} = useAuth();

  return (
    <View style={tw`flex-1 justify-center gap-20  items-center`}>
      <Text style={tw`text-black text-3xl `}>Please sign in</Text>
      <TouchableOpacity onPress={signIn}>
        <Image
          style={tw` w-20 h-20`}
          source={require('../images/google.png')}
        />
      </TouchableOpacity>
    </View>
  );
};

export default GoogleSignIn;
