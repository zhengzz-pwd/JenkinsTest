// AnyChat for Web SDK

/********************************************
 *				ҵ���߼�����				*
 *******************************************/
 
var mDefaultServerAddr = "192.168.13.68";		// Ĭ�Ϸ�������ַ
var mDefaultServerPort = 8906;					// Ĭ�Ϸ������˿ں�
var mSelfUserId = -1; 							// �����û�ID
var mTargetUserId = -1;							// Ŀ���û�ID�������˶Է�������Ƶ��
var mRefreshVolumeTimer = -1; 					// ʵʱ������С��ʱ��
var mRefreshPluginTimer = -1;					// ������Ƿ�װ��ɶ�ʱ��

// ��־��¼���ͣ�����־��Ϣ������ʾ��ͬ����ɫ
var LOG_TYPE_NORMAL = 0;
var LOG_TYPE_API = 1;
var LOG_TYPE_EVENT = 2;
var LOG_TYPE_ERROR = 3;

// ֪ͨ���ͣ���������Ϣ������ʾ��ͬ����ɫ
var NOTIFY_TYPE_NORMAL = 0;
var NOTIFY_TYPE_SYSTEM = 1;

var list_videouser;
var list_videosite;
var mDevices;
var mVideoCaptureDevice = "";


function LogicInit() {
     //��ȡ�������Ϣ����ƥ��Edge�����
    var ua = window.navigator.userAgent.toLowerCase();
    var info = {
        edge: /edge/.test(ua)
    };
    if(info.edge) {
       AddEdgePage();

    } else {
        setTimeout(function () {
            if (navigator.plugins && navigator.plugins.length) {
                window.navigator.plugins.refresh(false);
            }
            //����Ƿ�װ�˲�� 
            var NEED_ANYCHAT_APILEVEL = "0";                        // ����ҵ�����Ҫ��AnyChat API Level
            var errorcode = BRAC_InitSDK(NEED_ANYCHAT_APILEVEL);    // ��ʼ�����
            AddLog("BRAC_InitSDK(" + NEED_ANYCHAT_APILEVEL + ")=" + errorcode, LOG_TYPE_API);
            if (errorcode == GV_ERR_SUCCESS) {
                if(mRefreshPluginTimer != -1)
                    clearInterval(mRefreshPluginTimer);             // ��������װ��ⶨʱ��
                ShowLoginDiv(true);
                AddLog("AnyChat Plugin Version:" + BRAC_GetVersion(0), LOG_TYPE_NORMAL);
                AddLog("AnyChat SDK Version:" + BRAC_GetVersion(1), LOG_TYPE_NORMAL);
                AddLog("Build Time:" + BRAC_GetSDKOptionString(BRAC_SO_CORESDK_BUILDTIME), LOG_TYPE_NORMAL);
                
                GetID("prompt_div").style.display = "none";         // ���ز����װ��ʾ����
                // ��ʼ������Ԫ��
                InitInterfaceUI();
				//BRAC_SetSDKOption(131,1);
				
				mVideoCaptureDevice = BRAC_EnumDevices(BRAC_DEVICE_VIDEOCAPTURE) [0]
				
            } else {                        // û�а�װ��������ǲ���汾̫�ɣ���ʾ������ؽ���
                GetID("prompt_div").style.display = "block";
                SetDivTop("prompt_div", 300);
                if (errorcode == GV_ERR_PLUGINNOINSTALL)
                    GetID("prompt_div_line1").innerHTML = "�״ν�����Ҫ��װ������������ذ�ť���а�װ��";
                else if (errorcode == GV_ERR_PLUGINOLDVERSION)
                    GetID("prompt_div_line1").innerHTML = "��⵽��ǰ����İ汾���ͣ������ذ�װ���°汾��";
                    
                if(mRefreshPluginTimer == -1) {
                    mRefreshPluginTimer = setInterval(function(){ LogicInit(); }, 1000);
                }
            }
       }, 500);
    }
    
}

//����AnyChat��������Ҫ���յ���¼�ɹ��ص�֮�����
function ConfigAnyChatParameter(){
	
}


//����Edge������µ��ж�ҳ����ʽ
function AddEdgePage() {
    var iframeField = document.createElement('iframe');
    iframeField.src = './html/needie.html';
    iframeField.scrolling = "no";
    iframeField.frameborder = "0";
    iframeField.width = "100%";
    iframeField.height = "800px";
    document.body.style.backgroundColor = "#fff";
    document.body.appendChild(iframeField);
}

// ��ʼ������Ԫ��
function InitInterfaceUI() {
    //���ð�ť
    GetID("setting").onclick = function () {
        if (GetID("setting_div").style.display == "block")
            GetID("setting_div").style.display = "none";
        else
            GetID("setting_div").style.display = "block";
    }
    //��¼��ť
    GetID("loginbtn").onclick = function () {
		if(GetID("password").value == "�����Ϊ��")
			GetID("password").value = "";
        if (GetID("username").value != "") {
            DisplayLoadingDiv(true);
            var errorcode = BRAC_Connect(GetID("ServerAddr").value, parseInt(GetID("ServerPort").value)); //���ӷ�����
            AddLog("BRAC_Connect(" + GetID("ServerAddr").value + "," + GetID("ServerPort").value + ")=" + errorcode, LOG_TYPE_API);
            errorcode = BRAC_Login(GetID("username").value, GetID("password").value, 0);
            AddLog("BRAC_Login(" + GetID("username").value + ")=" + errorcode, LOG_TYPE_API);
            // �������ý���
            GetID("setting_div").style.display = "none";
        }
        else {
            GetID("a_error_user").style.color = "red";
            AddLog("The user name can not be empty!", LOG_TYPE_ERROR);
            GetID("username").focus();
        }
    }
    //�˳�ϵͳ
    GetID("ExitSystemBtn").onclick = function () {
        var errorcode = BRAC_Logout();
        AddLog("BRAC_Logout()=" + errorcode, LOG_TYPE_API);
        ShowHallDiv(false);
        ShowLoginDiv(true);
    }
    //�˳�����
    GetID("leaveroom").onclick = function () {
		
		for(var d = 0; d < mDevices.length; d++)
		{
			BRAC_UserCameraControlEx(-1,0,d,0,"");
		}
        var errorcode = BRAC_LeaveRoom(-1);
        AddLog("BRAC_LeaveRoom(" + -1 + ")=" + errorcode, LOG_TYPE_API);
		if(mRefreshVolumeTimer != -1)
			clearInterval(mRefreshVolumeTimer); // ���ʵʱ������ʾ��ʱ��
        ShowRoomDiv(false); 					// ���ط������
        ShowHallDiv(true); 						// ��ʾ��������
        mTargetUserId = -1;
    }
    //�����Զ��巿��
    GetID("EnterRoomBtn").onclick = function () {
        if (GetID("customroomid").value != "") {
            var re = /^[1-9]+[0-9]*]*$/;   //�ж��Ƿ�����
            if (re.test(GetID("customroomid").value)) {//������
                EnterRoomRequest(parseInt(GetID("customroomid").value));
            } else {
                AddLog("Room ID must be number!", LOG_TYPE_ERROR);
                GetID("customroomid").value = "";
                GetID("customroomid").focus();
            }
        }
    }
    //������Ϣ��ť
    //GetID("SendMsg").onclick = function () {
    //    SendMessage();
    //}
    //�س���������Ϣ
    //GetID("MessageInput").onkeydown = function (e) {
    //    e = e ? e : window.event; //�����¼�
    //    if (e.keyCode == 13 && GetID("MessageInput").value != "") {//�س���������ҷ�����Ϣ��Ϊ��
     //       SendMessage();
     //   }
    //}
    //���ز����ť��껮�뻮��ʱ��
    GetID("prompt_div_btn_load").onmouseover = function () {
        GetID("prompt_div_btn_load").style.backgroundColor = "#ffc200";
    }
    GetID("prompt_div_btn_load").onmouseout = function () {
        GetID("prompt_div_btn_load").style.backgroundColor = "#ff8100";
    }
    //���ز������رհ�ť
    GetID("prompt_div_headline2").onclick = function () {
        document.URL = location.href;
    }
    // ����Ƶ���־������
    GetID("LOG_DIV_BODY").onmousemove = function () {
        GetID("LOG_DIV_BODY").style.zIndex = 100;
        GetID("LOG_DIV_CONTENT").style.backgroundColor = "#FAFADD";
        GetID("LOG_DIV_CONTENT").style.border = "1px solid black";
    }
    // ������־�������ƿ�
    GetID("LOG_DIV_BODY").onmouseout = function () {
        GetID("LOG_DIV_BODY").style.zIndex = -1;
        GetID("LOG_DIV_CONTENT").style.backgroundColor = "#C4CEDD";
        GetID("LOG_DIV_CONTENT").style.border = "";
    }
    //�߼����ý���رհ�ť
    GetID("advanceset_div_close").onclick = function () {
        GetID("advanceset_div").style.display = "none";
		GetID("advanceset_iframe").style.display = "none";
    }
    //�߼�����
    GetID("advancedsetting").onclick = function () {
		
        if (GetID("advanceset_div").style.display == "block")
            GetID("advanceset_div").style.display = "none";
        else {
			GetID("advanceset_iframe").style.display = "block";
            GetID("advanceset_div").style.display = "block"; // ��ʾ�߼����ý���
			
            // ��ʼ���߼����ý���
            InitAdvanced();
        }
    }
}
var close = false;
function snapshot(){
	BRAC_StreamRecordCtrlEx(-1,1,0xac04,0,'');
	//BRAC_UserCameraControlEx(mSelfUserId,0,1,0,"");
	/* if(!close){
		BRAC_UserCameraControlEx(mSelfUserId,0,1,0,"");
		alert("�ر�");
	}
	else{
		BRAC_UserCameraControlEx(mSelfUserId,1,1,0,"");
		BRAC_UserCameraControlEx(mSelfUserId,0,2,0,"");
		alert("��");
	}
	close = !close; */
}

var start = false;
function record(){
    BRAC_SetSDKOption(BRAC_SO_RECORD_CLIPMODE, ANYCHAT_VIDEOCLIPMODE_SHRINK);
	if(!start){
		BRAC_StreamRecordCtrlEx(-1,1,0x1b37,0,'');
		alert("��ʼ");
	}
	else{
		BRAC_StreamRecordCtrlEx(-1,0,0x1b37,0,'');
		alert("����");
	}
	start = !start;
}

function PasswordFocus(obj,color){
	// �ж��ı����е������Ƿ���Ĭ������
	if(obj.value=="�����Ϊ��")
		obj.value="";
	obj.type="password";
	// �����ı����ȡ����ʱ�򱳾���ɫ�任
	obj.style.backgroundColor=color;
}
// ������뿪ʱ��ı��ı��򱳾���ɫ
function myblur(obj,color){
	obj.style.background=color;
}

//����߶Ȳ����ý���λ��
function SetDivTop(id, TheHeight) {
    var BodyHeight = document.documentElement.clientHeight; //���������ɼ�����߶�
	if (TheHeight < BodyHeight) {//div�߶�С�ڿɼ�����߶�
	    GetID("margintop").style.height = (BodyHeight - TheHeight) / 4 + "px";
	    GetID(id).style.marginTop = "0px";
    }
}

//ϵͳ��Ϣ�����������
function DisplayScroll(id) {
    var offset = GetID(id); //��Ҫ����div
	if (offset.offsetHeight < offset.scrollHeight) {//div�ɼ��߶�С��div�������߶�
		GetID(id).style.overflowY = "scroll";//��ʾ������
		GetID(id).scrollTop = GetID(id).scrollHeight;//�������Զ��������ײ�
	}
	else
		GetID(id).style.overflowY = "hidden";//���ع�����
}
//������Ϣ
function SendMessage() {
    if (GetID("MessageInput").value != "") {//������Ϣ��Ϊ��
        var Msg = GetID("MessageInput").value;
        BRAC_SendTextMessage(0, 0, Msg); //���÷�����Ϣ����
		DisplayTextMessage(mSelfUserId, Msg);
		GetID("MessageInput").value = "";
		GetID("MessageInput").focus();
	}
}

// ��ʾ������Ϣ
/* function DisplayTextMessage(fromuserid, message) {
	var namestr = BRAC_GetUserName(fromuserid) + "&nbsp" + GetTheTime();
	if(fromuserid==mSelfUserId)
		namestr = namestr.fontcolor("#008000");
	else
		namestr = namestr.fontcolor("#000080");
	message = message.fontcolor("#333333");

	var msgdiv = document.createElement("div");
	msgdiv.setAttribute("class", "TheMsgStyle");
	msgdiv.innerHTML = namestr + "��&nbsp&nbsp" + message;
	GetID("ReceiveMsgDiv").appendChild(msgdiv);
	DisplayScroll("ReceiveMsgDiv");
} */

// ��������Ϣ������ʾ֪ͨ��Ϣ
/* function ShowNotifyMessage(message, type) {
    if (type == NOTIFY_TYPE_SYSTEM) {
        message = message.fontcolor("#FF0000");
    } else {
        message = message.fontcolor("#333333");
    }
	var msgdiv = document.createElement("div");
    msgdiv.setAttribute("class", "TheMsgStyle");
	msgdiv.innerHTML = message + "&nbsp(" + GetTheTime().fontcolor("#999999") + ")";
    GetID("ReceiveMsgDiv").appendChild(msgdiv);
    DisplayScroll("ReceiveMsgDiv");
} */

// ��ʾ��¼����
function ShowLoginDiv(bShow) {
	if(bShow) {
		GetID("login_div").style.display = "block"; 	//��ʾ��¼����
		GetID("username").focus();
		SetDivTop("login_div", 195); 					//��¼���洹ֱ����
		GetID("LOG_DIV_BODY").style.display = "block"; 	//��ʾϵͳ��Ϣ��
		GetID("ServerAddr").value = mDefaultServerAddr;
		GetID("ServerPort").value = mDefaultServerPort;
	} else {
	
	}
}


function checkScreenCtrl()
{
	if (GetID("ScreenCtrl").checked == true){
		BRAC_SetSDKOption(BRAC_SO_CORESDK_SCREENCAMERACTRL, 1);
	}else{
		BRAC_SetSDKOption(BRAC_SO_CORESDK_SCREENCAMERACTRL, 0);
	}
}

// ��ʾ��������
function ShowHallDiv(bShow) {
    if (bShow) {
        GetID("room_div_userlist").innerHTML = ""; //��շ����������б�
		GetID("login_div").style.display = "none"; 		//���ص�¼����
		GetID("hall_div").style.display = "block"; 		//��ʾ��������
		GetID("customroomid").value = "";
		SetDivTop("hall_div", 400); 					//�������洹ֱ����
		GetID("customroomid").focus();
		GetID("a_error_user").style.color = "#FAFADD";
		
		GetID("hall_div_td_name").innerHTML = BRAC_GetUserName(mSelfUserId);
		GetID("hall_div_td_id").innerHTML = mSelfUserId;
		GetID("hall_div_td_level").innerHTML = BRAC_GetUserLevel(mSelfUserId);
		GetID("hall_div_td_ip").innerHTML = BRAC_QueryUserStateString(mSelfUserId, BRAC_USERSTATE_LOCALIP);
	} else {
		GetID("hall_div").style.display = "none";
	}
}

// ��ʾ�������
function ShowRoomDiv(bShow) {
    if (bShow) {
        GetID("hall_div").style.display = "none"; //���ش�������
        GetID("room_div").style.display = "block"; 	//��ʾ�������
        SetDivTop("room_div", 610); 				//������洹ֱ����
       // GetID("MessageInput").focus();
    } else {
        GetID("advanceset_div").style.display = "none"; //���ظ߼����ý���
       // GetID("ReceiveMsgDiv").innerHTML = ""; 		//��շ��������Ϣ���տ�
        GetID("room_div").style.display = "none"; 	//���ط������
    }
}

// �������ָ���ķ���
function EnterRoomRequest(roomid) {
	var errorcode = BRAC_EnterRoom(roomid, "", 0); //���뷿��
	AddLog("BRAC_EnterRoom(" + roomid + ")=" + errorcode, LOG_TYPE_API);
	if(errorcode == 0)
		DisplayLoadingDiv(true);
}

function GetID(id) {
	if (document.getElementById) {
		return document.getElementById(id);
	} else if (window[id]) {
		return window[id];
	}
	return null;
}
// ��ָ���û�������Ƶ
function RequestOtherUserVideo(userid) {
    var userlist = GetID("room_div_userlist");
    // ����û��б�������<a>��ǩ
    var userdivobj = userlist.getElementsByTagName("div");
    for (var i = 0; i < userdivobj.length; i++) {
        userdivobj[i].style.backgroundColor = "White"; 
    }
    // ��ȡ�û��б�������<img>��ǩ
    var userimgobj = userlist.getElementsByTagName("img");
    for (var j = 0; j < userimgobj.length; j++) {
        if (userimgobj[j].getAttribute("class") == "MicrophoneTag") { // ��ͼƬΪ ��Ͳ ͼƬ
            userimgobj[j].src = "./images/advanceset/microphone_false.png";
            userimgobj[j].onclick = ""; // ɾ����Ͳ��ť����¼�
            userimgobj[j].style.cursor = "";
        }
    }
    // �ж��Ƿ���Ҫ�ر�֮ǰ��������û�����Ƶ����
    if (mTargetUserId != -1) {
		for(var i = 0;i < 4;i++)
		{
			BRAC_UserCameraControlEx(mTargetUserId,0,i,0,"");
		}
		BRAC_UserSpeakControl(mTargetUserId, 0);
		
    }
    GetID(userid + "_MicrophoneTag").src = "./images/advanceset/microphone_true.png"; // ������ͲͼƬ
    GetID(userid + "_UserDiv").style.backgroundColor = "#E6E6E6"; //���ñ����<a>Ԫ�ص�������ɫ

    mTargetUserId = userid; 					//���ñ����û�IDΪȫ�ֱ���
	
	for(var j=0;j<4;j++)
		{
			BRAC_SetVideoPosEx(mTargetUserId, GetID("div_videoarea"+j), "ANYCHAT_VIDEO_REMOTE"+j,j);// ������Ƶ��ʾλ��
			BRAC_UserCameraControlEx(mTargetUserId, 1,j,0,""); // �򿪶Է���Ƶ
		}
		BRAC_UserSpeakControl(mTargetUserId, 1); // �򿪶Է���Ƶ

    MicrophoneOnclick(userid); // Ϊ��ǰ��Ƶ�Ự�û���Ͳ��ť��ӵ���¼�
}

// ���б��е��û�������ӡ�ɾ������
function RoomUserListControl(userid, bInsert) {
    var userlist = GetID("room_div_userlist");
    if (bInsert) {
        var itemdiv = document.createElement("div");
        itemdiv.setAttribute("class", "UserListStyle");
        itemdiv.id = userid + "_UserDiv";

        // �ж��û�����ͷ״̬
        if (BRAC_GetCameraState(userid) == 0)
            AddImage(itemdiv, userid + "_CameraTag", "CameraTag", "", userid); // �������ͷͼƬ<img>��ǩ
        if (BRAC_GetCameraState(userid) == 1)
            AddImage(itemdiv, userid + "_CameraTag", "CameraTag", "./images/advanceset/camera_false.png", userid); // �������ͷͼƬ<img>��ǩ
        if (BRAC_GetCameraState(userid) == 2)
            AddImage(itemdiv, userid + "_CameraTag", "CameraTag", "./images/advanceset/camera_true.png", userid); // �������ͷͼƬ<img>��ǩ
		if(BRAC_GetSpeakState(userid)==1)
		{
			 AddImage(itemdiv, userid + "_MicrophoneTag", "mSelfMicrophoneTag", "./images/advanceset/microphone_true.png", userid); // ��ӻ�ͲͼƬ<img>��ǩ
		}
		else
		{
			 AddImage(itemdiv, userid + "_MicrophoneTag", "MicrophoneTag", "./images/advanceset/microphone_false.png", userid); // ��ӻ�ͲͼƬ<img>��ǩ
		}
        // �жϵ�ǰID�Ƿ�Ϊ�Լ�
        if (userid == mSelfUserId) {
            itemdiv.innerHTML += "&nbsp" + BRAC_GetUserName(mSelfUserId) + "(�Լ�)";
        } else {
            // ����û�����<a>��ǩ
            var a = document.createElement("a");
            a.id = userid + "_UserTag";
            a.title = BRAC_GetUserName(userid);
            a.innerHTML = BRAC_GetUserName(userid);
            a.href = "javascript:RequestOtherUserVideo(" + userid + ")";
			//alert("test");
			//a.href = "javascript:onVideoScreenChange()";
            itemdiv.appendChild(a);
        }
        GetID("room_div_userlist").appendChild(itemdiv);
        MicrophoneOnclick(mSelfUserId);
    } else {
        var my = GetID(userid + "_UserDiv");
        userlist.removeChild(my);
    }
    DisplayScroll("room_div_userlist");
}
//div��ť��껮�뻮��Ч��
function Mouseover(id) {
	GetID(id).style.backgroundColor = "#FFFFCC";
}
//div��ť��껮�뻮��Ч��
function Mouseout(id) {
	GetID(id).style.backgroundColor = "#E6E6E6";
}
//��ȡ��ǰʱ��  (00:00:00)
function GetTheTime() {
	var TheTime = new Date();
	return TheTime.toLocaleTimeString();
}

// �����־����ʾ�����ݲ�ͬ��������ʾ��ͬ����ɫ
function AddLog(message, type) {
    if (type == LOG_TYPE_API) {			// API������־����ɫ
        message = message.fontcolor("Green");
	} else if(type == LOG_TYPE_EVENT) {	// �ص��¼���־����ɫ
        message = message.fontcolor("#CC6600");
	} else if(type == LOG_TYPE_ERROR) {	// ������־����ɫ
        message = message.fontcolor("#FF0000");
	} else {							// ��ͨ��־����ɫ
        message = message.fontcolor("#333333");
	}
    GetID("LOG_DIV_CONTENT").innerHTML += message + "&nbsp" + GetTheTime().fontcolor("#333333") + "<br />";
	DisplayScroll("LOG_DIV_CONTENT");
}

// ��ʾ�ȴ�����������ʾ�û��������ڽ�����
function DisplayLoadingDiv(bShow) {
    if (bShow) {
        GetID("LOADING_DIV").style.display = "block";
        GetID("LOADING_GREY_DIV").style.display = "block";
        var TheHeight = document.documentElement.clientHeight;
        var TheWidth = document.body.offsetWidth;
        GetID("LOADING_DIV").style.marginTop = (TheHeight - 50) / 2 + "px";
        GetID("LOADING_DIV").style.marginLeft = (TheWidth - 130) / 2 + "px";
    }
    else {
        GetID("LOADING_DIV").style.display = "none";
        GetID("LOADING_GREY_DIV").style.display = "none";
    }
}

//���� ����ͷ  ��Ͳ  ͼ��
function AddImage(parent_id, img_id, img_class, fir_img, userid) {
    var imgs = document.createElement("img");
    imgs.id = img_id;
    imgs.className = img_class;
    imgs.src = fir_img;
    imgs.style.width = "15px";
    imgs.style.height = "15px";
    parent_id.appendChild(imgs);
}
// Ϊ������û���Ͳ��ť��ӵ���¼�
function MicrophoneOnclick(userid) {
    GetID(userid + "_MicrophoneTag").style.cursor = "pointer"; // �����״
    GetID(userid + "_MicrophoneTag").onclick = function () { // ��Ͳ����¼�
        var ImgPath = GetID(userid + "_MicrophoneTag").src.split('/');
        if (ImgPath[ImgPath.length - 1] == "microphone_true.png") {
            GetID(userid + "_MicrophoneTag").src = "./images/advanceset/microphone_false.png";
            BRAC_UserSpeakControl(userid, 0); // �ر�����
        }
        else {
            GetID(userid + "_MicrophoneTag").src = "./images/advanceset/microphone_true.png";
            BRAC_UserSpeakControl(userid, 1); // ��������
        }
    }
}

function localVideoStream()
{
	var div = GetID("AnyChatLocalVideoDiv");
	while(div.hasChildNodes()) //��div�»������ӽڵ�ʱ ѭ������
    {
        div.removeChild(div.firstChild);
    }
	
	list_videostream=new Array();
	list_videosite=new Array();
	
	//var videoCount=parseInt(objectDiv.options[(objectDiv.selectedIndex)].value);
	mDevices = BRAC_EnumDevices(BRAC_DEVICE_VIDEOCAPTURE);
	var count=0;
	for(var i=0;i<mDevices.length;i++)
	{
		// �����û���Ƶ����div
		var div_localvideosite = document.createElement("div");
		div_localvideosite.id="div_localvideosite"+i;
		div_localvideosite.className = "CLASS_LOCATVIDEOSCREEN"+4;
		// ������Ƶ�û�������div
		var div_localstreamname = document.createElement("div");
		div_localstreamname.id="div_localstreamname"+i;
		div_localstreamname.className = "CLASS_LOCALVIDEOSCREEN_USERNAME"+4;
		div_localvideosite.appendChild(div_localstreamname);
		// �����û���Ƶ�����div
		var div_localvideoarea = document.createElement("div");
		div_localvideoarea.id="div_localvideoarea"+i;
		div_localvideoarea.className = "CLASS_VIDEOSCREEN_LOCALVIDEOAREA"+4;
		div_localvideosite.appendChild(div_localvideoarea);
	    div.appendChild(div_localvideosite);
		list_videosite[i]=0;
		list_videostream[i]=0;
	}
	
	
	
	for(var i=0;i<mDevices.length;i++){
		//ָ��ĳһ·����ͷ��
		 /*if (i == 1 || i == 2)
            continue; */
		BRAC_SetUserStreamInfo(-1, i, BRAC_STREAMINFO_VIDEOCODECID,mDevices[i]);
		BRAC_SetVideoPosEx(mSelfUserId, GetID("div_localvideoarea"+i), "AnyChatLocalVideoDiv"+i,i);// ������Ƶ��ʾλ��
		BRAC_UserCameraControlEx(mSelfUserId,1,i,0,"");
		
		BRAC_UserSpeakControl(mSelfUserId, 1); // �򿪶Է���Ƶ
		list_videosite[i]=1;
		count++;
		
		mRefreshBrateTimer = setInterval(function () { 
			for(var k=0;k<mDevices.length;k++)
			{
				GetID("div_localstreamname"+k).innerHTML = k+"·��Ƶ���ʣ�"+parseInt(BRAC_GetUserStreamInfoInt(-1,k,BRAC_STREAMINFO_VIDEOBITRATE)/1000)+"KB/S";
			}	
	}, 3000);
		
		
		
		
	}
	
}

function createRemoteVideoDiv()
{
	var div = GetID("AnyChatRemoteVideoDiv");
    while(div.hasChildNodes()) //��div�»������ӽڵ�ʱ ѭ������
    {
        div.removeChild(div.firstChild);
    }
	
	list_videouser=new Array();
	list_videosite=new Array();

	//������������Ҫ��div
	for(var i=0;i<4;i++)
	{
		// �����û���Ƶ����div
		var div_videosite = document.createElement("div");
		div_videosite.id="div_videosite"+i;
		div_videosite.className = "CLASS_VIDEOSCREEN"+4;
		// ������Ƶ�û�������div
		var div_username = document.createElement("div");
		div_username.id="div_username"+i;
		div_username.className = "CLASS_VIDEOSCREEN_USERNAME"+4;
		div_videosite.appendChild(div_username);
		// �����û���Ƶ�����div
		var div_videoarea = document.createElement("div");
		div_videoarea.id="div_videoarea"+i;
		div_videoarea.className = "CLASS_VIDEOSCREEN_VIDEOAREA"+4;
		div_videosite.appendChild(div_videoarea);
	    div.appendChild(div_videosite);
		list_videosite[i]=0;
		list_videouser[i]=0;
	}
}

/*function onVideoScreenChange()
{
	//alert("hello select");
    var div = GetID("AnyChatRemoteVideoDiv");
    while(div.hasChildNodes()) //��div�»������ӽڵ�ʱ ѭ������
    {
        div.removeChild(div.firstChild);
    }
	//var objectDiv=GetID("videoscreensetting");
	//var videoCount=parseInt(objectDiv.options[(objectDiv.selectedIndex)].value);
	
	list_videouser=new Array();
	list_videosite=new Array();

	//������������Ҫ��div
	for(var i=0;i<4;i++)
	{
		// �����û���Ƶ����div
		var div_videosite = document.createElement("div");
		div_videosite.id="div_videosite"+i;
		div_videosite.className = "CLASS_VIDEOSCREEN"+4;
		// ������Ƶ�û�������div
		var div_username = document.createElement("div");
		div_username.id="div_username"+i;
		div_username.className = "CLASS_VIDEOSCREEN_USERNAME"+4;
		div_videosite.appendChild(div_username);
		// �����û���Ƶ�����div
		var div_videoarea = document.createElement("div");
		div_videoarea.id="div_videoarea"+i;
		div_videoarea.className = "CLASS_VIDEOSCREEN_VIDEOAREA"+4;
		div_videosite.appendChild(div_videoarea);
	    div.appendChild(div_videosite);
		list_videosite[i]=0;
		list_videouser[i]=0;
	}
		
	//��ʾ��Ƶ
	var useridlist = BRAC_GetOnlineUser();
	var count=0;
	for(var i=0;i<4;i++){
		if(count>=4)
			break;
		BRAC_SetVideoPosEx(useridlist[0], GetID("div_videoarea"+i), "ANYCHAT_VIDEO_REMOTE"+i,i);// ������Ƶ��ʾλ��
		BRAC_UserCameraControlEx(useridlist[0], 1,i,0,""); // �򿪶Է���Ƶ
		BRAC_UserSpeakControl(useridlist[i], 1); // �򿪶Է���Ƶ
		GetID("div_username"+0).innerHTML=BRAC_GetUserName(useridlist[0]);
		list_videouser[i]=useridlist[0];
		list_videosite[i]=1;
		count++;
	}
	if(count<videoCount){
		for(var i=0;i<videoCount-count;i++){
			BRAC_SetVideoPos(0, GetID("div_videoarea"+(i+count)), "ANYCHAT_VIDEO_REMOTE"+(i+count));// ������Ƶ��ʾλ��
			GetID("div_username"+(i+count)).innerHTML="��ǰû����";
		}
	}

}*/

function comeToRequestedScrenn(index)
{
	//GetID("videoscreensetting").selectedIndex=index;
	onVideoScreenChange();
}

function RequestVideoByUserId(dwUserId)
{
	var site=-1;
	for(var i=0;i<list_videosite.length;i++)
	{
		if(list_videosite[i]==0)
		{
			site=i;
			break;
		}

	}
	if(site<0)
		return;
	var bHashed=false;
	for(var i=0;i<list_videouser.length;i++)
	{
		if(list_videouser[i]==dwUserId)
		{
			bHashed=true;
			break;
		}
	}
	if(!bHashed)
	{
		
		for(var j=0;j<4;j++)
		{
			BRAC_SetVideoPosEx(dwUserId, GetID("div_videoarea"+j), "ANYCHAT_VIDEO_REMOTE"+j,j);// ������Ƶ��ʾλ��
			BRAC_UserCameraControlEx(dwUserId, 1,j,0,""); // �򿪶Է���Ƶ
		}
		BRAC_UserSpeakControl(dwUserId, 1); // �򿪶Է���Ƶ
		
	}
}