// ==UserScript==
// @name        CDA Link Adder
// @namespace   himself12794-develops.com
// @include     *gitscm.cisco.com/projects/*/repos/*
// @version     1.1
// @grant GM.xmlHttpRequest
// ==/UserScript==
(function(){
  var url = "https://dftapi.cisco.com/dft/cda/software-metadata/generate-id/post";
  var softwareId = null;
  var CDAElement = null;
  
  // Gets payload data from webpage
  function getMetadata() {
    var element = document.getElementById("ssh-clone-url");
    return {
      scmUrl: element.getAttribute("data-clone-url"),
      scmType: "git"
    };
  }
  
  function getSoftwareData(next) {
    console.log("Calling generate-id API");
    console.log("Sending payload: " + JSON.stringify(getMetadata()));
    GM.xmlHttpRequest({
      method: "POST",
      url: url,
      data: JSON.stringify(getMetadata()),
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      onload: function(response) {
        if (response.status < 200 && response.status >= 400) {
          return next(new Error("We reached our target server, but it returned an error."));
        }

        next(null, response.responseText);
      },
      onerror: function(response) {
        return next(new Error("There was a connection error of some sort."));
      }
    });
  }
  
  function populateData(error, data) {
    console.log("Received response: ");
    console.log(JSON.parse(data));
    if (!error && data) {
      softwareId = JSON.parse(data).data.softwareKey;
      console.log("Have software ID: " + softwareId);
      CDAElement.setAttribute("href", "http://cdanalytics.cisco.com/application/software/" + softwareId + "/summary");
    } else if (error) {
      console.log(error);
    }
    
  }
  
  function createElement() {
      var dupe = document.getElementById("repository-nav-pull-requests").cloneNode(true);
      dupe.setAttribute("href", "#");
      dupe.removeAttribute("data-web-item-key");
      dupe.setAttribute("id", "cda-nav-link");
      dupe.setAttribute("target", "_blank");
    
      var newLi = document.createElement("li");
      newLi.append(dupe);
      CDAElement = dupe;
      
      var el = document.querySelector("div.aui-sidebar-group.aui-sidebar-group-tier-one.sidebar-navigation ul");
      el.append(newLi);
    
      var img = document.querySelector("#cda-nav-link span.icon-pull-requests");
      img.style.backgroundImage = "url('https://cdanalytics.cisco.com/images/avatar.png')";
      img.style.backgroundSize = "20px 20px";
      document.querySelector("#cda-nav-link span.aui-nav-item-label").innerHTML = "CDA Website";
      var badge = document.querySelector("#cda-nav-link span.aui-badge");
      if (badge) {
        badge.remove();
      }
  }
  
  function main() {
    console.log("Loading script...");
    console.log("Creating elements...");
    createElement();
    console.log("Fetching CDA url...");
    getSoftwareData(populateData);
  }

  main();
  
})();