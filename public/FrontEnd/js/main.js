/**
 * Created by tasu on 04.07.16.
 * Description :  Code for interactive maps
 *
 */
var mapname;
var myCenter=new google.maps.LatLng(51.508742,-0.120850);
var socket=io();
var overlay;
var src;
var userid;
var password;
var markers=[];
var markerarray=[];
var loc1=[];
var nomap=0;
var map;
//From map page
var usermarkers=[];
var paths=[];


/*** Home page initializer **/
function homeinit(){
  //Reset Modal
  $('#myModal').on('show.bs.modal', function(){
    $('#registerusr')[0].reset();
    $('#info').text('');
  });

  userid="";
  password="";
  $(document).ready(function(){
    $('#guestlink').click(function(event){
      console.log("Guest link click");
      event.preventDefault();
      userid="guest";
      window.location.href="#dashboard";
    });
    $('input#usersub').click(function(event) {
      event.preventDefault();
      var data = {};
      data.name = $('#usr').val();
      data.password = $('#pass').val();
      console.log(data);
      username= $('#usr').val();
      $.ajax({
        url: '/login',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json'
      }).done(function (data) {
        console.log("Browser Data"+data);
        if(data != "fail")
        {
          console.log("Successful Login");
          userid=username;
          password=data.password;
          window.location.href="#dashboard";
        }
        else
        {
          console.log("Wrong cred");
          $('#usertext').text("The user id or password is wrong. Please re-enter!!");
          $('#usertext').css({'color':'red'});
          $('#usr').val('');
          $('#pass').val('');

        }
      });
    });

    $('#register').on('click',function(){
      var clientobj={};
      if($('#username').val() != '' || $('#password').val() != '' || $('#email').val() != ''){
        clientobj.username=$('#username').val();
        clientobj.password=$("#password").val();
        clientobj.email=$('#email').val();
        clientobj.name=$('#name').val();
        console.log(clientobj);

        $.ajax({
          url:'registeruser',
          type:'POST',
          data:JSON.stringify(clientobj),
          contentType:'application/json'
        }).done(function(msg){
          console.log("Returned message "+msg);
          if(msg == 'present'){
            //already present
            $('#info').text('User Id is already present. Please choose another');
            $('#info').css('color', 'red');
            //Reset All fields
            $('#registerusr')[0].reset();

          }
          else if(msg =='add'){
            //Added Successfully
            $('#myModal').modal('hide');
            $('#usertext').text("User added. Please Login");
            $('#usertext').css('color','green');

          }else
          {
            //Error Happed
            $('#myModal').modal('hide');
            $('#usertext').text("Error happened. Please try again later");
            $('#usertext').css('color','red');

          }

        });
      }
      else
      {
        $('usertext').text("Please enter value of Username/Password/Email");
      }

    });

    $("#header").hover(function(){
      $("#header").fadeOut(500, function(){
        $(this).text("We make trips better").fadeIn(500);
        $(this).fadeOut(500,function () {
          $(this).text("TripAround").fadeIn(500);
        });

      });
    }, function(){});

  });
}

/** User's Dashboard **/
function dashboardfunction(){
  $(document).ready(function(){
  $('#viewmapregion').empty();
  console.log("User logged in as "+userid);
  //Initialize the custom dialogue boxes
  //1. The user is guest
  $("#dialog").dialog({
    autoOpen:false,
    show:{
      effect:"blind",
      duration:100
    },
    hide:{
      effect:'explode',
      duration:1000
    },
    modal:true
  });
  //User has selected no maps
  if(nomap==0)
  {
    $('#info').text("Please select a Map. Or create a new One");
    $('#info').css('color', 'green');
  }
  //Save maps user
  $('#formcontainer').dialog({
    autoOpen:false,
    show:{
      effect:"blind",
      duration:1000
    },
    hide:{
      effect:'explode',
      duration:1000
    },
    modal:true
  });


  $('#savebutt').on('click', function(){
    console.log("Clicked on savebutton option");
    //Launch form
    if(userid =="guest"){
      $('#dialog').dialog("open");

    }else
    {
      //Launch form
     $('#myModal').modal('show');

      $("#submit").on('click', function(){
        console.log("User clicked submit!");
        if($('#mapname').val()=='')
        {
          $('#infofrm').text('please enter some map name to start');
          $('#infofrm').css('color', 'red');
          return;
        }
        else {
          //Create ajax data and send it to the server to save the map

          var dat={};
          dat.name=$('#mapname').val();
          dat.description=$('#descriptiontext').val();
          dat.userid=userid;

          $.ajax({
            url:'/mapsave',
            method:'POST',
            data:JSON.stringify(dat),
            contentType:'application/JSON'
          }).done(function(msg){
            console.log('Done');
            if(msg == 'yes') {

              $('#infofrm').text('Map is Saved');
              $('#infofrm').css('color', 'green');
              window.location.href="#UploadImages";
              mapname=dat.name;
              $('#myModal').modal('toggle');
              return false;
            }
            else
            {
              //Close this form and launch a new popup/modal/magnific popup and proceed to save images.
              $('#infofrm').text('Map cannot be Saved. Try again later');
              $('#infofrm').css('color', 'red');
            }
          });
          $('#myModal').modal('toggle');
          return false;
        }
      });

    }

  });
  //View Button
  $('#viewbutt').on('click', function(){
    console.log("Clicked on the view saved button options");
    if(userid =="guest"){
      $('#dialog').dialog("open");

    }else
    {
      //get map data from serverjs and store in div region : viewmapregion
      var getmap={};
      getmap.name=userid;
      $.ajax({
        url:'/viewmap',
        method:'POST',
        data:JSON.stringify(getmap),
        contentType:'application/JSON'
      }).done(function(msg){
        console.log("Returned message is "+msg);
        if(msg =="no"){
          $('#viewmapregion').text('You Have No Saved Maps. Please create one to start');
          $('#viewmapregion').css('color','green');
        }
        else
        {
          //call socket function
          socket.emit('getmaps', {userid:userid});
          socket.on('viewmaps', function(msg){
            console.log(msg.description);
          //Clear view map region
            var obj=document.getElementById(msg.name);
            if(obj == null) {
              $('#viewmapregion').append('<div id="maps"><a id="' + msg.name + '" class="button">' + msg.name + '</a> <div id="info">'+msg.description+'</div></div> ');
              $('#viewmapregion').css('color', 'green');
              $("#cancel").hide();
            }
          });
        }
      });
    }
  });

  $('#viewmapregion').on('click','a', function(event){
    console.log("Link clicked");
    console.log("Event id is"+event.target.id);
    mapname=event.target.id;
    window.location.href="#UploadImages";

  });

  $("#beforepagebutton").hover(function(){
    $("#beforepagebutton span").text("");
  }, function(){
    $("#beforepagebutton span").text("<");
  });
  $("#beforepagebutton").click(function(){
    window.location.href="#";
  });


  $("#nextpagebutton").hover(function(){
    $("#nextpagebutton span").text("");
  }, function(){
    $("#nextpagebutton span").text(">");
  });
  $("#nextpagebutton").click(function(){
    window.location.href="#UploadImages";
  });

  });
  //document ready function concludes
} //dashboard function finishes

/** Image upload Controller function **/
function imagecontroller(){
  var markercollec=[];
  var markerobj={};
  var markers=[];
  var picobj={};
  var maps={};
  console.log("User logged in as" + userid);
  console.log("The map id is as"+ mapname);
  initialize();
  $(document).ready(function(){
    if(mapname == undefined)
    {
      window.location.href="#dashboard";
    }
    else
    {
      nomap=1;
    }
    Dropzone.autoDiscover=false;
    //Dropzone Code
    var myDropZone=new Dropzone("#dropzonePreview",{
      url:"/dragdrop",
      autoProcessQueue:false,

      init:function(){
        this.on('addedfile', function(file){
          console.log("Added File");
            EXIF.getData(file, function(){
              var lat=EXIF.getTag(this,"GPSLatitude");
              var lon=EXIF.getTag(this,"GPSLongitude");
              var time=EXIF.getTag(this,"DateTime");
              var latRef = EXIF.GPSLatitudeRef || "N";
              var lonRef = EXIF.GPSLongitudeRef || "W";
              if(lat == undefined || lon== undefined)
                alert("Sorry No Geo Tags present in images");
              else {
                lat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef == "N" ? 1 : -1);
                lon = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef == "W" ? -1 : 1);
                var date=new Date();
                var tim=time;
                console.log("Latitide : " + lat);
                console.log("Longitude : " + lon);
                socket.emit('Latitude', lat);
                socket.emit('Longitude', lon);
                markerobj.lat=lat;
                markerobj.lon=lon;
                markerobj.time=tim;
                markerobj.id=userid+tim;
                console.log("File Name"+file.name);
                markerobj.filename=file.name;

                //********* input name *****************

                markercollec.push(markerobj);
                myCenter = new google.maps.LatLng(lat, lon);
                var marker = new google.maps.Marker({
                  position: myCenter
                });
                map.setCenter(marker.getPosition());
                map.setZoom(4);
                marker.setMap(map);
                markers.push(marker);
              }
            });

            //Add Remove button
            var removebutton=Dropzone.createElement("<button>Remove File</button>");
            var _this=this;
            removebutton.addEventListener("click", function(e){
              e.preventDefault();
              e.stopPropagation();
              _this.removeFile(file);
            });

            file.previewElement.appendChild(removebutton);
        });

        this.on("sending",function(file,xhr,formData){
          var userobj={};
          var mapn={};
          if(userid=="guest"){
            userobj.mapname="guestmap";
            mapn.name="guestmap";
          }else
          {
            userobj.mapname=mapname;
            mapn.name=mapname;
          }
          userobj.filename=file.name;
          userobj.id=userid;
          mapn.user=userid;
          formData.append("userobj", JSON.stringify(userobj));
          formData.append("mapname",JSON.stringify(mapn));
        });

        this.on("complete", function(file){
          if(this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0){
            //Reset Drpzone
            this.removeAllFiles(true);
          }
        });
      }
    });

    $('#savemap').click(function(evt){
      evt.preventDefault();
      myDropZone.processQueue();
      if(userid == "guest") {
        var form=new FormData();
        var dragdropfrm=new FormData();
        var filename=[];
        var formelement=document.getElementById('userphoto');
        var fileemenet=formelement.files;
        if(fileemenet.length>0)
        {
          for(var i=0;i<fileemenet.length;i++)
          {
            var filetmp=fileemenet[i];
            form.append('uploads[]',filetmp,filetmp.name);
            filename.push(filetmp.name);
            picobj=filetmp.name;
          }
        }
        $.ajax({
          url:"/guestlogin",
          type:"POST",
          data:form,
          processData:false,
          contentType:false
        }).done(function(msg){
          console.log(msg);
          if(msg == "yes") {
            $("#uploadstatus").text("File has been uploaded");
            $("#uploadstatus").css({"color":"green"});
            $("#uploadForm2")[0].reset();
            $('#dropzonePreview').on('complete',function(file){
              console.log("Finally!!");
              $('#dropzonePreview').removeAllFiles(true);
            });
          }
          else
            $("#uploadstatus").text("File has not been uploaded");
        });

        console.log("Names  "+filename);
        var userpicinfo={};
        userpicinfo.userid=userid;
        userpicinfo.filename=filename;

        $.ajax({
          url:"/guestdetailssave",
          type:'POST',
          data:JSON.stringify(userpicinfo),
          contentType:'application/json'
        }).done(function(msg){
          console.log("Done!!  " +msg);
        });

        var filename=$("#userphoto").val().split('\\').pop();
        console.log("Filename   "+filename);
        socket.emit('UserData',{id:userid,file:filename, mapid:"guestmap"});
      }
      else {
        //For registered users
        var form=new FormData();
        var dragdropfrm=new FormData();
        var filename=[];
        var formelement=document.getElementById('userphoto');
        var fileemenet=formelement.files;
        if(fileemenet.length>0)
        {
          for(var i=0;i<fileemenet.length;i++)
          {
            var filetmp=fileemenet[i];
            form.append('uploads[]',filetmp,filetmp.name);
            filename.push(filetmp.name);
            picobj=filetmp.name;
            var time=EXIF.getTag(filetmp,"DateTime");
            console.log("Date Time"+time);
          }
        }
        var userpic={};
        userpic.filename=filename;
        userpic.id=userid;
        userpic.mapname=mapname;
        var mapnameobj={};
        mapnameobj.user=userid;
        mapnameobj.name=mapname;
        form.append('userobj',JSON.stringify(userpic));
        form.append('mapname',JSON.stringify(mapnameobj));
        console.log("Map name"+mapname);
        $.ajax({
          url:"/userimageupload",
          type:"POST",
          data:form,
          processData:false,
          contentType:false
        }).done(function(msg){
          console.log(msg);
          if(msg == "yes") {

            $("#uploadstatus").text("File has been uploaded");
            $("#uploadstatus").css({"color":"green"});
            $("#uploadForm2")[0].reset();
            $('#dropzonePreview').on('complete',function(file){
              console.log("Finally!!");
              $('#dropzonePreview').removeAllFiles(true);
            });
          }
          else
            $("#uploadstatus").text("File has not been uploaded");
        });

        console.log("Names  "+filename);
        var filename=$("#userphoto").val().split('\\').pop();
        console.log("Filename   "+filename);
        //Socket was here

      }

      if(userid == "guest")
      { //save the guest map
        maps.name="guestmap";
        maps.id=userid;
        console.log("Map coordinates "+ markerobj);
        maps.markerobj=markercollec;
        $.ajax({
          url:"/mapupload",
          type:'POST',
          data:JSON.stringify(maps),
          contentType:'application/json'
        }).done(function(response){
          console.log(response);
          if(response =="yes") {
            $("#uploadstatus").text("The Map has been saved");
            $("#uploadstatus").css({"color":"green"});
            //Reset Map
            if($.isEmptyObject(markers) == false) {
              for (i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
              }
            }
            map.setCenter(new google.maps.LatLng(51.508742,-0.120850));
            map.setZoom(3);
          }
          else
          {
            $("#uploadstatus").text("The Map has not been saved");
            $("#uploadstatus").css({"color":"red"});
          }
        });
      }
      else {
        //For registered users
        maps.name=mapname;
        maps.id=userid;
        maps.markerobj=markercollec;
        console.log("Map collection"+ markercollec);
        console.log("Map coordinates "+ markerobj);
        $.ajax({
          url:"/mapupload",
          type:'POST',
          data:JSON.stringify(maps),
          contentType:'application/json'
        }).done(function(response){
          console.log(response);
          if(response =="yes") {
            $("#uploadstatus").text("The Map has been saved");
            $("#uploadstatus").css({"color":"green"});
            //Reset Map
            if($.isEmptyObject(markers) == false) {
              for (i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
              }
            }
            map.setCenter(new google.maps.LatLng(51.508742,-0.120850));
            map.setZoom(3);
          }
          else
          {
            $("#uploadstatus").text("The Map has not been saved");
            $("#uploadstatus").css({"color":"red"});
          }
        });
      }
    });
    $("#userphoto").on('change', function (event) {
      console.log("changed"+ event);
      var input=$("#userphoto").get(0).files;
      var count=0;
      for(var i=0;i<input.length;i++)
      {

        EXIF.getData(input[i], function(){
          var markerobj={};
          var lat=EXIF.getTag(this,"GPSLatitude");
          var lon=EXIF.getTag(this,"GPSLongitude");
          var tim=EXIF.getTag(this,"DateTime");
          var latRef = EXIF.GPSLatitudeRef || "N";
          var lonRef = EXIF.GPSLongitudeRef || "W";
          if(lat == undefined || lon== undefined)
            alert("Sorry No Geo Tags present in images");
          else {
            lat = (lat[0] + lat[1] / 60 + lat[2] / 3600) * (latRef == "N" ? 1 : -1);
            lon = (lon[0] + lon[1] / 60 + lon[2] / 3600) * (lonRef == "W" ? -1 : 1);
            var date=new Date();
            var tim=date.getMilliseconds();
            console.log("Latitide : " + lat);
            console.log("Longitude : " + lon);
            socket.emit('Latitude', lat);
            socket.emit('Longitude', lon);
            markerobj.lat=lat;
            markerobj.lon=lon;
            markerobj.time=tim;
            markerobj.id=userid+tim;
            var filename = $('#userphoto').val().split('\\').pop();
            var fil=document.getElementById("userphoto");
            console.log("Name is"+ this.name);
            markerobj.filename=this.name; //fix this
            //********* input name *****************
            //markercollec.push(markerobj);
            markercollec[count++]=markerobj;
            myCenter = new google.maps.LatLng(lat, lon);
            var marker = new google.maps.Marker({
              position: myCenter
            });
            map.setCenter(marker.getPosition());
            map.setZoom(4);
            marker.setMap(map);
            markers.push(marker);
          }
        });
      }
    });


    $("#nextpagebutton").hover(function(){
      $("#nextpagebutton span").text("");
    }, function(){
      $("#nextpagebutton span").text(">");
    });

    $("#nextpagebutton").click(function(){
      window.location.href="#ViewImages";
    });

    $("#beforepagebutton").hover(function(){
      $("#beforepagebutton span").text("");
    }, function(){
      $("#beforepagebutton span").text("<");
    });

    $("#beforepagebutton").click(function(){
      window.location.href="#dashboard";
    });
  });

}

function initialize(){
  var mapProp = {
    center:new google.maps.LatLng(51.508742,-0.120850),
    zoom:5,
    mapTypeId:'terrain'

  };

  map=new google.maps.Map(document.getElementById("googleMap"),mapProp);

  overlay = new google.maps.OverlayView();
  overlay.draw = function() {};
  overlay.setMap(map);

}

function placemarker(location, src){
  var markercoor=[];
  console.log("In place marker"+location);
  var marker=new google.maps.Marker({
    position:location,
  });
  markerarray.push(marker);
  marker.setMap(map);
  marker.addListener('click',function () {
    console.log("Image Source"+src);
    $('#image-container').append('<img class="imageholder" src="'+src+'"</img>');
    $('#myModal').modal('show');

  });
  markercoor.push(marker);
  $('#something').hide();

  console.log(markercoor);
}

function animateCircle(line){
  var count = 0;
  window.setInterval(function() {
    count = (count + 1) % 200;
    var icons = line.get('icons');
    console.log("Icons "+icons);
    icons[0].offset = (count / 2) + '%';
    line.set('icons', icons);
  }, 20);
}


//code for product html
$("#menu-toggle").click(function(e){
  e.preventDefault();
  $("#wrapper").toggleClass("toggled");
});

/** Controller for Map Page **/
function imageupload() {
  $(document).ready(function(){
    if(mapname == undefined)
      window.location.href="#UploadImages";
    else
      nomap=1;
    //Get markers and initialize them on map
    console.log("User logged in as "+userid);
    initialize();

    var input = document.getElementById('searchbox');
    var searchBox = new google.maps.places.SearchBox(input);

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      // Clear out the old markers.
      markers.forEach(function(marker) {
        marker.setMap(null);
      });
      markers = [];

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        // Create a marker for each place.
        markers.push(new google.maps.Marker({
          map: map,
          title: place.name,
          position: place.geometry.location
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });



    $("#beforepagebutton").hover(function(){
      $("#beforepagebutton span").text("");
    }, function(){
      $("#beforepagebutton span").text("<");
    });
    $("#beforepagebutton").click(function(){
      window.location.href="#UploadImages";
    });

    $('#something').hide();
    //Fetch images from Server using socketio


    socket.emit("ImageGall",{userid: userid, mapid:mapname});
    socket.on("imagereturn", function(mssg) {
      console.log("Thumbanils "+mssg.picname);
      var loc;
      if (userid == "guest") {
        var mapid = "guestmap";
        loc = "uploads/" + mssg.picname;
      }
      else
      {
        var mapid=mapname;
        loc=mssg.picpath+"/"+mssg.picname;
      }
      console.log("Locations "+loc);
      //if($("#thumbnail li").length === 0)
      var pic=document.getElementById(mssg.picname);
      if(pic == undefined)
        $("#thumbnail").append('<img src="'+loc+'" class="img-thumbnail" alt="Cinque Terre" id="'+mssg.picname+'">');
    });
    $("#thumbnail").tooltip({
      content:"Click here for Draggable Marker"
    });
    var clickname;
    var temp=document.getElementById("thumbnail");
    $('#thumbnail').on('click','img',function(event){
      console.log("Clicked"+event);
      console.log($(this).attr('src'));
      clickname=$(this).attr('src');

      if($('#something').is(':visible'))
        $('#something').hide();
      else
        $('#something').show();

       });
    $('#something').draggable({
      revert: true
    });

    $('#something').on('dragstop',function(evt,ui){
      var mOffset=$(map.getDiv()).offset();
      var point=new google.maps.Point( ui.offset.left-mOffset.left+(ui.helper.width()/2),ui.offset.top-mOffset.top+(ui.helper.height()));
      var ll=overlay.getProjection().fromContainerPixelToLatLng(point);
      placemarker(ll, clickname);

    });
    if(userid =="guest")
    {
      //request markers
      socket.emit("LoadMarker", {id:userid, mapid:"guestmap"});
      socket.on("drawmarkers",function(msg){
        paths=[];
        console.log(msg.lat+"    "+msg.lng);
        //draw markers on map
        paths.push({lat: msg.lat, lng:msg.lng});
        var myCenter = new google.maps.LatLng(msg.lat, msg.lng);
        var marker = new google.maps.Marker({
          position: myCenter
        });
        map.setCenter(marker.getPosition());
        map.setZoom(2);
        marker.setMap(map);
        marker.addListener('click',function () {
          console.log("Image Source"+src);
          $('#image-container').append('<img class="imageholder" src="uploads/'+userid+'/'+msg.filename+'"</img>');
          $('#myModal').modal('show');

        });
        markerarray.push(marker);
        var linesymbol={
          path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale:8,
          strokeColor:'#393'
        };
        var path=new google.maps.Polyline({
          path:paths,
          icons:[
            {
              icon:linesymbol,
              offset:'100%'
            }
          ],
          geodesic:true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });
        path.setMap(map);
        animateCircle(path);
      });
    }
    else
    {
      //registered users

      //airplane line
      var dashedline={
        path: 'M 0,-1 0,1',
        strokeOpacity: 1,
        strokeColor:'#393',
        scale: 5
      };
      //Bus line
      var busline={
        path: 'M 0,0,-1,-1,0, 0,1, 1',
        strokeOpacity: 1,
        strokeColor:'#393',
        scale: 2
      };

      var linesymbol={
        path:google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale:8,
        strokeColor:'#393'
      };

      socket.emit("LoadMarker", {id:userid, mapid:mapname});
      socket.on("drawmarkers",function data(msg){
        //draw markers on map
        console.log("Fetched data"+msg.lat+"  "+msg.lng);
        var temp={lat: msg.lat, lng:msg.lng};
        paths.push(temp);

        var myCenter = new google.maps.LatLng(msg.lat, msg.lng);
        var marker = new google.maps.Marker({
          position: myCenter
        });
        usermarkers.push(marker);
        map.setCenter(marker.getPosition());
        map.setZoom(2);
        marker.setMap(map);
        markerarray.push(marker);
        marker.addListener('click',function () {
          $('#image-container').append('<img class="imageholder" src="uploads/'+userid+'/'+msg.map+'/'+msg.filename+'"</img>');
          $('#myModal').modal('show');
        });

        var path=new google.maps.Polyline({
          path:paths,
          geodesic:true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2
        });
        //animateCircle(path);
        path.setMap(map);

        map.addListener("click", function(event){
           var latitude=event.latLng.lat();
           var longitude=event.latLng.lng();

          loop1:
           for(var i=0;i<paths.length;i++){
             //do something
              console.log(Math.abs(Math.abs(paths[i].lat) - Math.abs(latitude)));
              if(Math.abs((Math.abs(paths[i].lat) - Math.abs(latitude)))<5)
              {
               //call a function that brings up the modular
                $('#optionsmodal').modal('show');
                $('#airplane').on('click', function (evt) {
                  evt.preventDefault();
                  path.setOptions({
                    icons:[{
                      icon:dashedline,
                      offset:'0',
                      repeat:'90px'
                    }],
                    strokeColor: '#ffc433',
                  });
                });
                $('#bus').on('click', function (evt) {
                  evt.preventDefault();
                  path.setOptions({
                    icons:[{
                      icon:busline,
                      offset:'0',
                      repeat:'50px'
                    }],
                    strokeColor: '#9ba3f3',
                  });
                });
                break loop1;
              }
           }

        });

      });

    }

  });

  }



//Controller for Image gallery page
function imagegallerycontroller(){
  if(mapname == undefined){
    //User has not chosen a map
    window.location.href="#dashboard";
  }
  else
    nomap=1;
  $(document).ready(function(){
     $('#imagegall').magnificPopup({
        delegate:'a',
        type:'image',
        image:{
          verticalFit:true
        },
       gallery:{
         enabled:true
       },
       callbacks:{
         open:function(){

         },
         beforeClose:function (){
         }
       }
      });

    //$('.blueberry').blueberry();

    console.log("User is logged as"+ userid);
    if(userid =="guest")
    {
      var mapid="guestmap";
    }
    else {
      var mapid=mapname;
    }

    socket.emit("ImageGall",{userid: userid, mapid:mapid});
    socket.on("imagereturn", function(mssg){
      console.log(mssg);
      console.log(mssg.picname);
      console.log(mssg.picpath);
      if(userid=="guest"){
        var mapid="guestmap";
        var loc="uploads/"+mssg.picname;
      }
      else
      {
        var loc=mssg.picpath+"/"+mssg.picname;
      }
      if(mssg.picname != undefined && mssg.picpath!=undefined) {
        console.log("loc"+loc);
        loc1.push(loc);
        var temp=document.getElementById(mssg.picname);
        if(temp == undefined)
          $('#imagegall').append('<a href="'+loc+'" id="image"><img class="images" src="'+loc+'" height="75" width="75"id="'+mssg.picname+'"></a>');
       // $('#slides').append('<li><img src="'+loc+'"/></li>');
      }
    });
    console.log("Loc  "+loc1);
  });
}

function airplanehandler(){
  var startpos,startend;
  var path;
  console.log("In airplane loop");
  var flightPlanCoordinates = [
    {lat: 37.772, lng: -122.214},
    {lat: 21.291, lng: -157.821},
    {lat: -18.142, lng: 178.431},
    {lat: -27.467, lng: 153.027}
  ];

  map.addListener("click",function(event){
    var obj=[];
    map.setOptions({draggable: false});
    console.log(event.latLng);
    startpos=event.latLng.lat();
    startend=event.latLng.lng();
    var coors=new google.maps.LatLng(startpos,startend);
    var coorssum=new google.maps.LatLng(startpos+5,startend+5);
    map.panTo(coors);
    var tempobj= {lat: 37.772, lng: -122.214};
    obj.push(coors);
    obj.push(coorssum);
    console.log("obj"+obj);
     path=new google.maps.Polyline({
      path:obj,
      editable:true,
      map:map
    });
    if(path!=undefined) {
      path.addListener("click", function (event) {
        console.log("Dragging");
      });
    }
  });

  map.setOptions({draggable: true});

}

//end of the code for product html

//Angular js and Routing

var tripapp= angular.module('tripapp', ['ngRoute']);

tripapp.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl: '/FrontEnd/partials/home.html',
    controller: 'maincontroller'
  })
    .when('/viewmaps',{
      templateUrl:'/FrontEnd/partials/map.html',
      controller:'mapcontroller'
    })

    .when('/UploadImages',{
      templateUrl:'/FrontEnd/partials/imageupload.html',
      controller: 'imagecontroller'
  })

  .when('/ViewImages',{
    templateUrl:'/FrontEnd/partials/map.html',
    controller: 'mapcontroller'
  })

  .when('/imagegallery',{
      templateUrl:'/FrontEnd/partials/imagegallery.html',
      controller: 'imagegallerycontroller'
  })

  .when('/dashboard',{
    templateUrl:'/FrontEnd/partials/dashboard.html',
    controller:'dashboardcontroller'
  });

});


tripapp.controller('maincontroller',function($scope){
  $scope.init=homeinit();
  $scope.message="Hi there";

});

tripapp.controller('productcontroller', function($scope){
  $scope.init=initialize();
});

tripapp.controller('mapcontroller', function($scope){
  $scope.userid=userid;
  $scope.mapname=mapname;
  $scope.init=imageupload();

});

tripapp.controller('imagecontroller', function($scope){
  $scope.userid=userid;
  $scope.map=mapname;
  $scope.init=imagecontroller();

});

tripapp.controller('imagegallerycontroller', function($scope){
  $scope.userid=userid;
  $scope.map=mapname;
  $scope.init=imagegallerycontroller();

});

tripapp.controller('dashboardcontroller', function($scope){
  $scope.userid=userid;
  $scope.init=dashboardfunction();

});



