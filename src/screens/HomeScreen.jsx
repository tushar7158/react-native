import React, {useState} from 'react';
import tw from 'twrnc';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Button,
} from 'react-native';
import {useAuth} from '../auth/AuthContext'; 
import { useDispatch, useSelector } from 'react-redux';
import { setPin } from '../redux/slices/PinSlice';

const HomeScreen = () => {
  const dispatch = useDispatch();
  const pin = useSelector(state => state.pin).pin;
  console.log(pin);
  
  const {signOut} = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const {user} = route.params || {}; // Retrieve user data from params
  const [password, setPassword] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isChangePinModalVisible, setChangePinModalVisible] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const confirmSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', onPress: signOut},
    ]);
  };

  const handleAccessProductDetails = () => {
    setModalVisible(true); // Show the modal when button is pressed
  };

  const validatePassword = () => {
    if (password === pin) {
      setPassword(null)
      setModalVisible(false); // Hide modal
      navigation.navigate('ProductsData'); // Navigate to ProductsData
    } else {
      Alert.alert('Incorrect Password', 'Please try again.');
    }
  };
  const handleChangePin = () => {
    if (oldPin === pin) {
      if (newPin.length === 4) {
        dispatch(setPin(newPin)); // Update the PIN in Redux
        setOldPin('');
        setNewPin('');
        setChangePinModalVisible(false);
        Alert.alert('Success', 'PIN has been updated successfully');
      } else {
        Alert.alert('Invalid PIN', 'PIN should be 4 digits');
      }
    } else {
      Alert.alert('Incorrect Old PIN', 'Please enter the correct current PIN');
    }
  };

  return (
    <View style={tw`flex-1 justify-start gap-20 items-center`}>
      <Text style={tw`text-black mt-4 text-2xl`}>Welcome, {user.name}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('INVOICE')}
        style={tw`border-2 rounded-full bg-green-500 bg-opacity-10 border-green-700 p-15   `}>
        <Text style={tw`text-black text-2xl text-green-700`}>
          Start new invoice
        </Text>
      </TouchableOpacity>
      <View style={tw`flex-1 flex-row flex-wrap justify-center gap-5`}>
        <TouchableOpacity
          style={tw`border-2 px-5 rounded-lg h-24 w-36 flex justify-center items-center`}
          onPress={() => navigation.navigate('AddItems')}>
          <Text style={tw`text-black text-lg text-center`}>Register Items</Text>
        </TouchableOpacity>

        {/* Button that calls the password-protected function */}
        <TouchableOpacity
          style={tw`border-2 px-5 rounded-lg h-24 w-36 flex justify-center items-center`}
          onPress={handleAccessProductDetails}>
          <Text style={tw`text-black text-lg text-center`}>
            Available Items
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign out button */}
      <View style={tw`flex flex-row gap-5`}>
        <TouchableOpacity
          style={tw`border-2 border-red-600  rounded-lg h-12 mb-10 w-30 flex justify-center items-center`}
          onPress={confirmSignOut}>
          <Text style={tw`text-red-600 text-lg`}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`border-2 border-yellow-500  rounded-lg h-12 mb-10 w-30 flex justify-center items-center`}
          onPress={()=>setChangePinModalVisible(true)}>
          <Text style={tw`text-yellow-500 text-lg`}>Change PIN</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for password prompt */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-8 rounded-lg w-80`}>
            <Text style={tw`text-lg font-bold mb-4`}>Enter Password</Text>
            <TextInput
              value={password}
              keyboardType="numeric"
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry={true}
              style={tw`border-b-2 text-black text-center border-gray-300 mb-6 p-2`}
            />
            {/* <Button title="Submit" onPress={validatePassword} /> */}
            <TouchableOpacity
              style={tw` border-2 border-black rounded-lg`}
              onPress={validatePassword}>
              <Text style={tw`text-black text-lg text-center `}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw` border-2 mt-2 border-black rounded-lg`}
              onPress={() => {
                setModalVisible(false);
                setPassword(null);
              }}>
              <Text style={tw`text-black text-lg  text-center `}>Cancel</Text>
            </TouchableOpacity>
            {/* <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} /> */}
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={isChangePinModalVisible}
        animationType="slide"
        onRequestClose={() => setChangePinModalVisible(false)}>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-8 rounded-lg w-80`}>
            <Text style={tw`text-lg font-bold mb-4`}>Change PIN</Text>

            <TextInput
              value={oldPin}
              keyboardType="numeric"
              onChangeText={setOldPin}
              placeholder="Enter old PIN"
              secureTextEntry={true}
              style={tw`border-b-2 text-black text-center border-gray-300 mb-6 p-2`}
            />

            <TextInput
              value={newPin}
              keyboardType="numeric"
              onChangeText={setNewPin}
              placeholder="Enter new PIN"
              secureTextEntry={true}
              style={tw`border-b-2 text-black text-center border-gray-300 mb-6 p-2`}
            />

            <TouchableOpacity
              style={tw`border-2 border-black rounded-lg mb-4`}
              onPress={handleChangePin}>
              <Text style={tw`text-black text-lg text-center`}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`border-2 border-black rounded-lg`}
              onPress={() => {
                setChangePinModalVisible(false);
                setOldPin('');
                setNewPin('');
              }}>
              <Text style={tw`text-black text-lg text-center`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;
