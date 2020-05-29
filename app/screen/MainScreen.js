import React, {Component} from 'react';
import {
	SafeAreaView,
	StyleSheet,
	ScrollView,
	View,
	Image,
	Text,
	Animated,
	Dimensions,
	TextInput,
	TouchableOpacity,
	FlatList,
	StatusBar,
	BackHandler,
	Keyboard,
	ActivityIndicator,
	Alert,
	Platform,
	Linking
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import {WebView} from 'react-native-webview';
import {request, checkMultiple, PERMISSIONS, RESULTS, openSettings} from 'react-native-permissions';
import * as WeChat from 'react-native-wechat';//首先导入react-native-wechat
import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob'
import Spinner from 'react-native-loading-spinner-overlay';


// const REQUEST_URL = 'https://kebenju.localhost.com';
// const REQUEST_URL = 'https://192.168.2.4/';
// const REQUEST_URL = 'https://kebenju.hulalaedu.com/';
// const REQUEST_URL = 'https://xijukecheng.pagekite.me/';
const REQUEST_URL = 'https://xijvkecheng.hulalaedu.com/';
const WECHAT_APPID = 'wxb7532c0995b93389';
const WECHAT_APPSECRET = '68778f76077595d000faa01672970fbd';

export default class MainScreen extends Component {
  constructor(props) {
    super(props);
	this.state = {
		spinner: false,
		loadingText: 'Loading...'
	};
	
	this.onMessage = this.onMessage.bind(this);
	this.weixinLogin = this.weixinLogin.bind(this);
	this.weixinPayment = this.weixinPayment.bind(this);
	this.showReferencePdf = this.showReferencePdf.bind(this);
	this.downloadFileFromUrl = this.downloadFileFromUrl.bind(this);
  }

	async componentDidMount() {
		Orientation.lockToLandscape();
		if( Platform.OS === 'android' ){
			this.requestPermissionAndroid()
		} else if( Platform.OS === 'ios' ){
			this.requestPermissionIOS()
		}
		
		var regStatus = await WeChat.registerApp(WECHAT_APPID);
		console.log('-- regStatus : ', regStatus);
	}


	requestPermissionAndroid() {
		checkMultiple([
			PERMISSIONS.ANDROID.CAMERA, 
			PERMISSIONS.ANDROID.RECORD_AUDIO, 
			PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
		]).then(
			async (statuses) => {
				if( statuses[PERMISSIONS.ANDROID.CAMERA] == RESULTS.DENIED ){
					await request(PERMISSIONS.ANDROID.CAMERA).then(
						(statuses) => {
							console.log('-- Camera', statuses[PERMISSIONS.ANDROID.CAMERA]);
						},
					);
				}

				if( statuses[PERMISSIONS.ANDROID.RECORD_AUDIO] == RESULTS.DENIED ){
					await request(PERMISSIONS.ANDROID.RECORD_AUDIO).then(
						(statuses) => {
							console.log('-- RecordAudio', statuses[PERMISSIONS.ANDROID.RECORD_AUDIO]);
						},
					);
				}

				if( statuses[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] == RESULTS.DENIED ){
					await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE).then(
						(statuses) => {
							console.log('-- WriteExternalStorage', statuses[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE]);
						},
					);
				}

				if( statuses[PERMISSIONS.ANDROID.CAMERA] == RESULTS.BLOCKED || 
					statuses[PERMISSIONS.ANDROID.RECORD_AUDIO] == RESULTS.BLOCKED || 
					statuses[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] == RESULTS.BLOCKED ){
					await openSettings().catch(()=>{
						console.warn('cannot open settings')
					})
					console.log('-- openSettings finish')
				}
			}
		);
	}


	onLoad( syntheticEvent ) {
		var {nativeEvent} = syntheticEvent;
		console.log('-- url : ', nativeEvent.url)
	}


	onError( syntheticEvent ) {
		var {nativeEvent} = syntheticEvent;
		console.log('-- error : ', nativeEvent)
	}


	onHttpError( syntheticEvent ) {
		var {nativeEvent} = syntheticEvent;
		console.log('-- httpError : ', nativeEvent)
	}


	onMessage( event ) {
		console.log('-- onMessage event : ', event, event.nativeEvent);
  
		if( !event.nativeEvent || !event.nativeEvent.data || event.nativeEvent.data == "undefined" ) {
		console.log('-- nativeEvent is not valid');
		return;
		}
		
		var data = JSON.parse( event.nativeEvent.data );
		console.log('-- onMessage data : ', data);

		if( data.cmd ){
			switch(data.cmd){
				case 'weixin_login':					
					this.weixinLogin(data.data)
					break;
				case 'weixin_payment':					
					this.weixinPayment(data.data)
					break;
				case 'show_reference_pdf':	
					if( data.data && data.data.pdfURL ){				
						this.showReferencePdf(data.data.pdfURL)
					} else {
						Alert.alert('网址无效。')
					}
					break;
				case 'script_pdf_print':		
					if( data.data && data.data.downloadURL ){
						var downloadUrl = data.data.downloadURL				
						this.downloadFileFromUrl(downloadUrl, 'print.pdf')
					} else {
						Alert.alert('网址无效。')
					}
					break;
				case 'head_img_print':		
					if( data.data && data.data.downloadURL ){
						var downloadUrl = data.data.downloadURL				
						this.downloadFileFromUrl(downloadUrl, 'head.png')
					} else {
						Alert.alert('网址无效。')
					}	
					break;
				case 'make_script_pdf':	
					if( data.data && data.data.downloadURL ){
						var downloadUrl = data.data.downloadURL	
						this.downloadFileFromUrl(downloadUrl, 'script.pdf')
					} else {
						Alert.alert('网址无效。')
					}
					break;
				case 'waiting_indicator':	
					if( data.data && data.data.visible != undefined ){
						this.setState({
							loadingText: '',
							spinner: data.data.visible
						})
					}					
					break;
				default:
					break;
			}
		}
		
	}


	async weixinLogin(data){
		if( data && data.userToken ){
			console.log('-- User Token : ', data.userToken);
			try{
				var authReq = await WeChat.sendAuthRequest("snsapi_userinfo");
				console.log('-- authReq : ', authReq, authReq.code);

				if( authReq.code ){
					var code = authReq.code;
					var url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+WECHAT_APPID+"&secret="+WECHAT_APPSECRET+"&code="+authReq.code+"&grant_type=authorization_code"
					axios.get(url)
						.then(res => {
							const resp = res.data;
							console.log('-- resp : ', resp);

							if( resp && resp.access_token && resp.openid )
							url = "https://api.weixin.qq.com/sns/userinfo?access_token=" + resp.access_token + "&openid="+ resp.openid
							axios.get(url)
								.then(res => {
									const userInfo = res.data;
									console.log('-- userInfo : ', userInfo);

									if( userInfo && userInfo.nickname ){
										url = REQUEST_URL + "signin/setUserInfo?nickname="+userInfo.nickname+"&sex="+userInfo.sex+"&token="+data.userToken+"&avatar="+userInfo.headimgurl+"&openId="+resp.openid
										console.log('-- url : ', url)
										axios.get(url)
											.then(res => {
												const retUserInfo = res.data;
												console.log('-- retUserInfo : ', retUserInfo);
	
												
											})
									}
									
								})
						})
				}
			} catch( error ){
				console.log('-- error : ', error)
			}
			
		} else {
			Alert.alert('Error', 'User token is not valid')
		}
	}


	async weixinPayment(data){
		if( data && data.noncestr ){
			console.log('-- weixinPayment data : ', data);
			try{
				var ret = await WeChat.pay({
					partnerId: data.partnerid,
					prepayId: data.prepayid,
					nonceStr: data.noncestr,
					timeStamp: data.timestamp,
                    package: '',
					sign: data.sign
				});
				console.log('-- ret : ', ret);
			} catch( error ){
				console.log('-- error : ', error)
			}
			
		} else {
			Alert.alert('Error', 'User token is not valid')
		}
	}


	async showReferencePdf(pdfUrl){
		console.log('-- showReferencePdf pdfUrl : ', pdfUrl);
		Linking.openURL(pdfUrl);
		// if( Platform.OS === 'android' ){
		// 	RNFetchBlob.android.actionViewIntent(pdfUrl, '/')
		// } else if( Platform.OS === 'ios' ){
		// 	RNFetchBlob.ios.previewDocument(pdfUrl);
		// }
	}


	async downloadFileFromUrl(downloadUrl, fileName){
		var url = REQUEST_URL + downloadUrl;
		let filePath = RNFetchBlob.fs.dirs.DownloadDir + '/' + fileName;
		console.log('-- downloadFileFromUrl url : ', url, filePath);

		this.setState({
			loadingText: '下载中...',
			spinner: true
		});

		var that = this;
		RNFetchBlob.config({
			addAndroidDownloads : {
				useDownloadManager : true,
				title : fileName,
				description : 'File was downloaded successfully',
				notification : true,
				path : filePath
			}
		})
		.fetch('GET', url)
		.then((res) => {
			console.log('-- downloadFileFromUrl success')
			that.setState({
				loadingText: '',
				spinner: false
			});
			if( Platform.OS === 'android' ){
				RNFetchBlob.android.actionViewIntent(res.path(), '/')
			} else if( Platform.OS === 'ios' ){
				RNFetchBlob.ios.previewDocument(res.path());
			}
		})
	}


	render() {
		var { spinner, loadingText } = this.state;
		return (
			<View style={{flex: 1}}>
				<Spinner
					visible={spinner}
					textContent={loadingText}
					textStyle={styles.spinnerTextStyle}
					// size={'normal'}
				/>
				<WebView
					source={{
						uri: REQUEST_URL,
					}}
					javaScriptEnabled={true}
					domStorageEnabled={true}
					startInLoadingState={true}
					onLoad={syntheticEvent => {this.onLoad(syntheticEvent)}}
					onError={syntheticEvent => {this.onError(syntheticEvent)}}
					onLoadProgress={({ nativeEvent }) => {
						console.log('-- loadProgress : ', nativeEvent.progress);
					  }}
					onHttpError={syntheticEvent => {this.onHttpError(syntheticEvent)}}
					onMessage={event => {this.onMessage(event)}}
					style={{
						flex: 1,
					}}				
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	spinnerTextStyle: {
	  color: '#FFF',
	  fontSize: 14
	},
  });