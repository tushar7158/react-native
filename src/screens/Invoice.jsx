import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  BackHandler,
  Modal,
} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import RNPrint from 'react-native-print';
import tw from 'twrnc';
import {datacollection} from './ProductsData';
import {getDocs} from '@react-native-firebase/firestore';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

const InvoiceGenerator = () => {
  const [productList, setProductList] = useState([]);
  const [isScanned, setIsScanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(true); // Modal visibility state
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Confirm Exit',
          'Are you sure you want to leave the invoice screen? Any unsaved changes will be lost.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Yes',
              onPress: () => navigation.goBack(), // Navigate back if the user confirms
            },
          ],
          {cancelable: true},
        );
        return true; // Prevent default back behavior
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation]),
  );

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(datacollection);
        const items = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        setData(items);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle QR code scan success
  const handleQRCodeScan = e => {
    setIsScanned(true); // Change state when QR code is scanned
    // Process scanned data here
    console.log('Scanned Data: ', e.data);

    // Reset the scanned state after a delay if needed
    setTimeout(() => setIsScanned(false), 2000); 
    const scannedItem = data.filter(item => item.id === e.data)[0];

    if (!scannedItem) {
      Alert.alert('Error', 'Product not found in the database.');
      return;
    }

    const newProduct = {
      id: scannedItem.id,
      name: scannedItem.name,
      price: scannedItem.price,
      commission: scannedItem.commission,
      quantity: 1, // Set default quantity to 1
    };

    // Check if the product is already in the list
    const existingProduct = productList.find(item => item.id === newProduct.id);
    if (existingProduct) {
      incrementQuantity(existingProduct.id);
    } else {
      setProductList(prev => [...prev, newProduct]);
      updateTotalAmount([...productList, newProduct]);
    }
  };

  // Update total amount based on product list
  const updateTotalAmount = updatedList => {
    const total = updatedList.reduce(
      (sum, product) =>
        sum + (product.price + product.commission) * product.quantity,
      0,
    );
    setTotalAmount(total);
  };

  // Increment product quantity
  const incrementQuantity = productId => {
    const updatedList = productList.map(product =>
      product.id === productId && product.quantity < product.maxQuantity // Ensure the quantity does not exceed available stock
        ? {...product, quantity: product.quantity + 1}
        : product,
    );
    setProductList(updatedList);
    updateTotalAmount(updatedList);
  };

  // Decrement product quantity
  const decrementQuantity = productId => {
    const updatedList = productList.map(product =>
      product.id === productId && product.quantity > 1
        ? {...product, quantity: product.quantity - 1}
        : product,
    );
    setProductList(updatedList);
    updateTotalAmount(updatedList);
  };

  // Generate printable invoice
  const generatePrintableInvoice = async () => {
    const productRows = productList
      .map(
        product =>
          `<tr>
            <td>${product.name}</td>
            <td>${product.price + product.commission}</td>
            <td>${product.quantity}</td>
            <td>${(product.price + product.commission) * product.quantity}</td>
          </tr>`,
      )
      .join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <p>Customer Name: ${customerName}</p>
          <p>Customer Address: ${customerAddress}</p>
          <h2>Products</h2>
          <table>
            <tr>
              <th>Product</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
            ${productRows}
          </table>
          <h3>Total Amount: ₹${totalAmount}</h3>
        </body>
      </html>
    `;

    try {
      await RNPrint.print({html: htmlContent});
    } catch (err) {
      console.error('Error generating printable invoice: ', err);
    }
  };

  // Function to validate and close the customer details modal
  const handleCustomerDetailsSubmit = () => {
    if (customerName && customerAddress) {
      setIsCustomerModalVisible(false);
    } else {
      Alert.alert('Error', 'Please enter both customer name and address.');
    }
  };

  // Function to cancel and go back to the home screen
  const handleCancelInvoice = () => {
    Alert.alert(
      'Cancel Invoice',
      'Are you sure you want to cancel and go back to the home screen?',
      [
        {text: 'No', style: 'cancel'},
        {
          text: 'Yes',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  return (
    <View style={{flex: 1}}>
      {/* Modal for entering customer details */}
      <Modal
        transparent={true}
        visible={isCustomerModalVisible}
        animationType="slide"
        onRequestClose={() => {
          Alert.alert('You need to enter customer details before proceeding.');
        }}>
        <View
          style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white p-8 rounded-lg w-80`}>
            <Text style={tw`text-lg font-bold mb-4`}>Customer Details</Text>
            <TextInput
              placeholder="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              style={tw`border-b-2 text-black text-center border-gray-300 mb-4 p-2`}
            />
            <TextInput
              placeholder="Customer Address"
              value={customerAddress}
              onChangeText={setCustomerAddress}
              style={tw`border-b-2 text-black text-center border-gray-300 mb-6 p-2`}
            />
            <TouchableOpacity
              style={tw`border-2 border-black rounded-lg mb-4`}
              onPress={handleCustomerDetailsSubmit}>
              <Text style={tw`text-black text-lg text-center`}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`border-2 border-red-500 rounded-lg`}
              onPress={handleCancelInvoice}>
              <Text style={tw`text-red-500 text-lg text-center`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main invoice screen */}
      <ScrollView style={tw`  p-5`}>
        {/* <Text style={tw`text-black text-2xl `}>Invoice Generator</Text> */}

        <View style={tw`flex-1 w-[100vw] p-10 justify-center items-center`}>
            <QRCodeScanner
              onRead={handleQRCodeScan}
              reactivate={true} // Keeps the QR scanner active
              reactivateTimeout={1000} // Time delay before the scanner reactivates
              topContent={<Text style={tw`z-1`}>Scan a product QR code</Text>}
              // bottomContent={
              //   <TouchableOpacity style={styles.cancelButton}>
              //     <Text style={styles.cancelButtonText}>Stop Scanning</Text>
              //   </TouchableOpacity>
              // }
              cameraStyle={tw`h-40 w-40 m-auto`} // Set height and width for the camera screen
              showMarker={true} // Optionally, show the marker to make it clear where to scan
              markerStyle={tw`border- w-25  h-25 ${isScanned ? 'border-green-500' : 'border-blue-500'}`} // Optional marker customization
            />
        </View>

        <View style={[styles.productRow, tw``]}>
          <Text style={[styles.productName, tw`text-gray-400 flex-1`]}>
            Name
          </Text>
          <View style={tw`flex-row flex-1 justify-between`}>
            <Text style={[styles.productName, tw`text-gray-400`]}>Price</Text>
            <Text style={[styles.productName, tw`text-gray-400`]}>Qty</Text>
            <Text style={[styles.productName, tw`text-gray-400`]}>Total</Text>
          </View>
        </View>

        {productList.length > 0 ? (
          <FlatList
            data={productList}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <View style={styles.productRow}>
                <Text style={[styles.productName, tw`flex-1 text-black`]}>
                  {item.name}
                </Text>
                <View style={tw`flex-row flex-1 justify-between`}>
                  <Text style={[styles.productName, tw`text-black`]}>
                    ₹{item.price + item.commission}
                  </Text>
                  <View style={tw`flex-row items-center justify-center`}>
                    <TouchableOpacity
                      onPress={() => decrementQuantity(item.id)}
                      style={styles.quantityButton}>
                      <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.productName, tw`text-yellow-500`]}>
                      {item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => incrementQuantity(item.id)}
                      style={styles.quantityButton}>
                      <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.productName, tw`text-blue-400`]}>
                    ₹{(item.price + item.commission) * item.quantity}
                  </Text>
                </View>
              </View>
            )}
          />
        ) : (
          <Text style={tw`text-gray-400 text-center`}>
            No products added yet
          </Text>
        )}

        <Text style={styles.totalText}>Total: ₹{totalAmount}</Text>

        <TouchableOpacity
          onPress={generatePrintableInvoice}
          style={styles.printButton}>
          <Text style={styles.printButtonText}>Generate Invoice</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scanButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#FF4C4C',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f9f9f9',
    marginVertical: 5,
    borderRadius: 5,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'right',
    marginTop: 15,
    color: 'green',
  },
  printButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    marginVertical: 15,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  quantityButton: {
    backgroundColor: '#f2f2f2',
    padding: 5,
    borderRadius: 3,
  },
  buttonText: {
    fontSize: 18,
    color: '#333',
  },
});

export default InvoiceGenerator;
