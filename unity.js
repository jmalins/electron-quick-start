var request = require('request');

// replace with your own appname, serviceusername, and servicepassword!
var ff = {
  "appname": 'HealthReactor.NeauxClick.TestApp',
  "serviceusername": 'Healt-ce66-NeauxClick-test',
  "servicepassword": 'H%fLthR9@Ct0Rn%7^xCc#C5t%st8pp'
}

var Url = 'http://tw115ga-azure.unitysandbox.com';
var Svc_username = ff.serviceusername;
var Svc_password = ff.servicepassword;
var Appname      = ff.appname;
var Ehr_username = 'jmedici';
var Ehr_password = 'password01';

// create the shitty unity JSON bundle //
var _buildJSON = (action, appname, ehruserid, patientid, unitytoken,
                 param1, param2, param3, param4, param5, param6, data) => 
  {         
    return { 
      'Action': action,
      'Appname': appname,
      'AppUserID': ehruserid,
      'PatientID': patientid,
      'Token': unitytoken,
      'Parameter1': param1 || '', 'Parameter2': param2 || '', 
      'Parameter3': param3 || '', 'Parameter4': param4 || '', 
      'Parameter5': param5 || '', 'Parameter6': param6 || '',
      'Data': data || ''
    };
  };

// post JSON to endpoint //
var _unityAction = (json, callback) => {
    request.post({
        url:     Url + '/Unity/UnityService.svc/json/MagicJson',
        headers: {'Content-Type': 'application/json'},
        body:    JSON.stringify(json)
      }, (err, res, body) => {
        callback(err, body);
      });
}

// build Magic action JSON string
module.exports = {
  buildJSON:   _buildJSON,
  unityAction: _unityAction,
  getToken: (callback) => {
    request.post({
        url: Url + '/Unity/UnityService.svc/json/GetToken',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify( { 'Username': Svc_username, 'Password': Svc_password } )
      }, (err, res, body) => {
        if(err) {
          callback(err);
          return;
        }
        if(body.indexOf('Error') != -1) {
          _token = null;
          callback(body);
          return;
        }
        callback(null, _token = body);
      });
  },
  authEHR: (callback) => {
    var json = _buildJSON('GetUserAuthentication', Appname, Ehr_username, '', _token, Ehr_password);
    _unityAction(json, (err, body) => {
      if(err) {
        callback(err);
        return;
      }
      var bodyJson = JSON.parse(body);
      var valid_user = bodyJson[0]['getuserauthenticationinfo'][0]['ValidUser'];
      if(valid_user == 'YES') {
        callback(null);
      } else {
        callback('EHR user is invalid: ' + body[0]['getuserauthenticationinfo'][0]['ErrorMessage']);
      }
    });
  },
  getServerInfo: (callback) => {
    var json = _buildJSON('GetServerInfo', Appname, Ehr_username, '', _token);
    _unityAction(json, callback);
  },
  getUserDetails: (callback) => {
    var json = _buildJSON('GetUserDetails', Appname, Ehr_username, '', _token);
    _unityAction(json, callback);
  },
  // callback is invoked with: { status: [success/error], data: [data] }
  saveVital: (patientId, data, callback) => {
    var xml = 
      '<savevitalsdatarequest>'
        + '<savevitalsdata fieldid=\"' + data.type + '\" value1=\"' + data.value + '\"';

    if(data.value2 != null) {
      xml += ' value2=\"' + data.value2 + '\"';
    }
    if(data.unit != null) {
      xml += ' units=\"' + data.unit + '\"';
    }

    xml += ' />' + '</savevitalsdatarequest>';

    var json = _buildJSON('SaveVitalsData', ehrUsername, appname, patientId, token, xml);
    _unityAction(json, callback);
  },
  saveProblemsData: (patientId, data, callback) => {
    var xml = 
      "<saveproblemsdatarequest>" 
        + "<saveproblemsdata setid=\"" + data.id + "\" fieldid=\"problem\" attributeid=\"title\" value1=\"" + data.title + "\"/>" 
        + "<saveproblemsdata setid=\"" + data.id + "\" fieldid=\"problem\" attributeid=\"code\" value1=\"" + data.code + "\" />" 
        + "<saveproblemsdata setid=\"" + data.id + "\" fieldid=\"problem\" attributeid=\"source\" value1=\"" + data.source + "\"/>" 
        + "<saveproblemsdata setid=\"" + data.id + "\" fieldid=\"status\" value1=\"" + data.status + "\"/>" 
        + "<saveproblemsdata setid=\"" + data.id + "\" fieldid=\"severity\" value1=\"" + data.severity + "\"/>"
      + "</saveproblemsdatarequest>";

    var json = _buildJSON('SaveProblemsData', ehrUsername, appname, patientId, token, xml);
    _unityAction(json, callback);
}
  
}


/*var getPatients = function(){
  console.log('GetPatients:');

  var stdin = process.openStdin();

  console.log('Enter a Patient ID to display (e.g., 324): ');
  stdin.addListener("data", function(d) {
        // note:  d is an object, and when converted to a string it will
        // end with a linefeed.  so we (rather crudely) account for that  
        // with toString() and then substring() 
    var data=d.toString().trim();
        console.log("you entered: [" + data + "]");

    if (!data) {
          console.log('No patient ID specified; exiting.');
      emitter.emit('CleanUp');
    }
    else {
      // Call GetPatient Magic action; Parameter1-6 and data not used in this example
      var json = buildJSON('GetPatient', Appname, Ehr_username, data, token);
      unityAction(json, function(body) {
        console.log('Output from GetPatient: ');
        console.log(JSON.stringify(body));
        emitter.emit('CleanUp');
      });
    }
    });

};*/

