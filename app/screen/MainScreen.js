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
import RNFileSelector from 'react-native-file-selector';
import DocumentPicker from 'react-native-document-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
const audioRecorderPlayer = new AudioRecorderPlayer();


// const REQUEST_URL = 'https://kebenju.localhost.com';
// const REQUEST_URL = 'https://192.168.2.4/';
// const REQUEST_URL = 'https://kebenju.hulalaedu.com/';
const REQUEST_URL = 'https://xijvkecheng.hulalaedu.com/';
const WECHAT_APPID = 'wxb7532c0995b93389';
const WECHAT_APPSECRET = '68778f76077595d000faa01672970fbd';

export default class MainScreen extends Component {

	dubbingInfo = [];

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
		this.audioRecordStart = this.audioRecordStart.bind(this);
		this.audioRecordStop = this.audioRecordStop.bind(this);
		this.audioPlayStart = this.audioPlayStart.bind(this);
		this.audioPlayPause = this.audioPlayPause.bind(this);
		this.audioPlayStop = this.audioPlayStop.bind(this);
		this.saveDubbingRead = this.saveDubbingRead.bind(this);
		this.uploadShootingFile = this.uploadShootingFile.bind(this);
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
		console.log('-- document dir : ', RNFetchBlob.fs.dirs.DocumentDir);
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


	requestPermissionIOS() {
		checkMultiple([
			PERMISSIONS.IOS.CAMERA, 
			PERMISSIONS.IOS.MICROPHONE, 
			PERMISSIONS.IOS.MEDIA_LIBRARY,
			PERMISSIONS.IOS.PHOTO_LIBRARY
		]).then(
			async (statuses) => {
				if( statuses[PERMISSIONS.IOS.CAMERA] == RESULTS.DENIED ){
					await request(PERMISSIONS.IOS.CAMERA).then(
						(statuses) => {
							console.log('-- Camera', statuses[PPERMISSIONS.IOS.CAMERA]);
						},
					);
				}

				if( statuses[PERMISSIONS.IOS.MICROPHONE] == RESULTS.DENIED ){
					await request(PERMISSIONS.IOS.MICROPHONE).then(
						(statuses) => {
							console.log('-- RecordAudio', statuses[PERMISSIONS.IOS.MICROPHONE]);
						},
					);
				}

				if( statuses[PERMISSIONS.IOS.MEDIA_LIBRARY] == RESULTS.DENIED ){
					await request(PERMISSIONS.IOS.MEDIA_LIBRARY).then(
						(statuses) => {
							console.log('-- MediaLibrary', statuses[PERMISSIONS.IOS.MEDIA_LIBRARY]);
						},
					);
				}

				if( statuses[PERMISSIONS.IOS.PHOTO_LIBRARY] == RESULTS.DENIED ){
					await request(PERMISSIONS.IOS.PHOTO_LIBRARY).then(
						(statuses) => {
							console.log('-- PhotoLibrary', statuses[PERMISSIONS.IOS.PHOTO_LIBRARY]);
						},
					);
				}

				if( statuses[PERMISSIONS.IOS.CAMERA] == RESULTS.BLOCKED || 
					statuses[PERMISSIONS.IOS.MICROPHONE] == RESULTS.BLOCKED || 
					statuses[PERMISSIONS.IOS.MEDIA_LIBRARY] == RESULTS.BLOCKED || 
					statuses[PPERMISSIONS.IOS.PHOTO_LIBRARY] == RESULTS.BLOCKED ){
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
				case 'audio_record_start':					
					this.audioRecordStart(data.data)
					break;
				case 'audio_record_stop':					
					this.audioRecordStop(data.data)
					break;
				case 'audio_play_start':					
					this.audioPlayStart(data.data)
					break;
				case 'audio_play_stop':					
					this.audioPlayStop(data.data)
					break;
				case 'append_dubbing_read':					
					this.appendDubbingRead(data.data)
					break;
				case 'save_dubbing_read':					
					this.saveDubbingRead(data.data)
					break;
				case 'upload_shooting_file':					
					this.uploadShootingFile(data.data)
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


	audioRecordStart = async (data) => {
		if( data && data.type ){
			console.log('-- audioRecordStart');
			const result = await audioRecorderPlayer.startRecorder();
			audioRecorderPlayer.addRecordBackListener((e) => {
				this.setState({
					recordSecs: e.current_position,
					recordTime: audioRecorderPlayer.mmssss(
					Math.floor(e.current_position),
					),
				});
				return;
			});
			console.log(result);
		}		
	};
	
	audioRecordStop = async (data) => {
		if( data && data.type ){
			console.log('-- audioRecordStop');
			const result = await audioRecorderPlayer.stopRecorder();
			audioRecorderPlayer.removeRecordBackListener();
			this.setState({
			recordSecs: 0,
			});
			console.log(result);
		}
	};
	
	audioPlayStart = async (data) => {
		if( data && data.type ){
			console.log('-- audioPlayStart');
			const msg = await audioRecorderPlayer.startPlayer();
			console.log(msg);
			var that = this;
			audioRecorderPlayer.addPlayBackListener((e) => {
				if (e.current_position === e.duration) {
					console.log('finished 1');			
					audioRecorderPlayer.stopPlayer();
	console.log('-- 1')
					var messageType = '';
					if( data.type == 'read' ) messageType = 'read-play-stop';
					else if( data.type == 'qna' ) messageType = 'qna-play-stop';
					else if( data.type == 'dubbing' ) messageType = 'dubbing-play-stop';

					var jsCode = `
						var iframe = document.getElementById('courseware_iframe').contentWindow;
						var message = {
							type: '${messageType}'
						}
						console.log('${messageType}');
						console.log('-- iframe : ', iframe);
						iframe.postMessage(JSON.stringify(message), '*');	
					`;
					console.log('-- 2 : ', jsCode)
					console.log('-- webview : ', that.webview, that.webview.injectJavaScript)
					that.webview.injectJavaScript(jsCode);
					console.log('-- 3')
				}
				that.setState({
					currentPositionSec: e.current_position,
					currentDurationSec: e.duration,
					playTime: audioRecorderPlayer.mmssss(Math.floor(e.current_position)),
					duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
				});
				return;
			});
		}
	};
	
	audioPlayPause = async (data) => {
		if( data && data.type ){
			await audioRecorderPlayer.pausePlayer();
		}
	};
	
	audioPlayStop = async (data) => {
		if( data && data.type ){
			console.log('-- audioPlayStop');
			audioRecorderPlayer.stopPlayer();
			audioRecorderPlayer.removePlayBackListener();
		}
	};

	appendDubbingRead(data) {
		if( data.info == undefined ) return;
		if( data.start == true ) {
			this.dubbingInfo = [];
			this.dubbingReadBlub = [];
		}

		this.dubbingInfo.push(data.info)
		this.dubbingReadBlub.push({

		})
	}

	saveDubbingRead(data) {
		if( data.coursewareId == undefined ) return;
		
		var url = REQUEST_URL + 'middle/contents/upload';
		var postData = [
			{ name : 'file', data : data.fileName},
			{ name : 'new_filename', data : data.fileName},
			{ name : 'coursewareId', data : ''+data.coursewareId},
			{ name : 'type', data : data.type},
			{ name : 'read-bg-video', data : data.readBgVideo},
		];

		for( var i=0; this.dubbingReadBlub.length; i++ ){
			postData.push({ name : 'read-blob[]', filename : data.fileName, data: RNFetchBlob.wrap(this.dubbingReadBlub[i])})
			postData.push({ name : 'info[]', data: this.dubbingInfo[i]});
		}

		RNFetchBlob.fetch('POST', url, {
			'Content-Type' : 'multipart/form-data',
		}, postData).then((resp) => {
			this.setState({
				loadingText: '',
				spinner: false
			})
			console.log('-- resp : ', resp);

			if( resp.data != '' ){
				Alert.alert("上传失败了。");
			} else {
				Alert.alert("上传成功了。");
			}
			return;
		}).catch((err) => {
			this.setState({
				loadingText: '',
				spinner: false
			})
			console.log('-- err : ', err)
		})
	}


	async uploadShootingFile(data) {
		if( data.coursewareId == undefined ) return;
		
		RNFileSelector.Show(
			{
				title: '选择文件',
				onDone: (path) => {
					console.log('-- file path : ' + path)
					var fileName = path.split('/');
					fileName = fileName[fileName.length-1];					
					console.log('-- fileName : ', fileName);

					var fileExt = fileName.split('.');
					var newFileName = fileName.replace('.'+fileExt[fileExt.length-1], '');
					fileExt = fileExt[fileExt.length-1];
					
					console.log('-- fileExt : ', fileExt, newFileName);
					if( fileExt != 'mp4' && fileExt != 'mov' ){
						Alert.alert("上传失败了。请选择视频文件。")
						return;
					}

					this.setState({
						loadingText: '',
						spinner: true
					})

					var url = REQUEST_URL + 'middle/contents/upload';
					RNFetchBlob.fetch('POST', url, {
						'Content-Type' : 'multipart/form-data',
					}, [
						{ name : 'file', filename : fileName, data: RNFetchBlob.wrap(path)},
						// elements without property `filename` will be sent as plain text
						{ name : 'upload_file', data : 'true'},
						{ name : 'type', data : 'shooting'},
						{ name : 'coursewareId', data : ''+data.coursewareId},
						{ name : 'new_filename', data : newFileName},
					]).then((resp) => {
						this.setState({
							loadingText: '',
							spinner: false
						})
						console.log('-- resp : ', resp);

						if( resp.data != '' ){
							Alert.alert("上传失败了。");
						} else {
							Alert.alert("上传成功了。");
						}
						return;
					}).catch((err) => {
						this.setState({
							loadingText: '',
							spinner: false
						})
						console.log('-- err : ', err)
					})
				},
				onCancel: () => {
					console.log('-- cancelled')
				}
			}
		)
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
					ref={webview => this.webview = webview}				
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
					allowsInlineMediaPlayback={true}
					mediaPlaybackRequiresUserAction={false} 
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