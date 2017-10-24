// ==UserScript==
// @name        CDA Link Adder
// @namespace   himself12794-develops.com
// @include     *gitscm.cisco.com/projects/*/repos/*
// @version     1.2
// @downloadURL https://gitscm.cisco.com/projects/CALL/repos/cda-userscript-for-browsers/raw/CDA_Link_Adder.user.js
// @grant GM_xmlhttpRequest
// ==/UserScript==
(function(){
  var url = "https://dftapi.cisco.com/dft/cda/software-metadata/generate-id/post";
  var verifyUrl = "https://dftapi.cisco.com/code/cda/metadata/v2/software/";
  var softwareId = null;
  var duplicatedNodeId = "repository-nav-pull-requests";
  var CDAElement = null;
  var CDAElementId = "cda-nav-link";
  var selectors = [
    "div.aui-sidebar-group.aui-sidebar-group-tier-one.sidebar-navigation ul", // Parent element selector
    "#cda-nav-link span.icon-pull-requests", // Image element selector
    "#cda-nav-link span.aui-nav-item-label", // Tooltip selector
    "#cda-nav-link span.aui-badge" // Selector for removing pull request tooltip on clone
  ];

  var data = {
    iconUrl: "url('https://cdanalytics.cisco.com/images/avatar.png')",
    iconSize: "20px 20px",
    hrefLocation: "http://cdanalytics.cisco.com/application/software/$&/summary",
    tooltipInfo: "CDA Website"
  };
  
  // Gets payload data from webpage
  function getMetadata() {
    var element = document.getElementById("ssh-clone-url");
    return {
      scmUrl: element.getAttribute("data-clone-url"),
      scmType: "git"
    };
  }
  
  function hideElement() {
	CDAElement.style.display = "none";
  }
  
  function showElement() {
	  CDAElement.style.display = "";
  }
  
  function createElement() {
    var dupe = document.getElementById(duplicatedNodeId).cloneNode(true);
    dupe.setAttribute("href", "#");
    dupe.removeAttribute("data-web-item-key");
    dupe.setAttribute("id", CDAElementId);
    dupe.setAttribute("target", "_blank");
    
    var newLi = document.createElement("li");
    newLi.append(dupe);
    CDAElement = dupe;
      
    var el = document.querySelector(selectors[0]);
    el.append(newLi);
    
    var img = document.querySelector(selectors[1]);
    img.style.backgroundImage = data.iconUrl;
    img.style.backgroundSize = data.iconSize;
    document.querySelector(selectors[2]).innerHTML = data.tooltipInfo;
    var badge = document.querySelector(selectors[3]);
    if (badge) {
      badge.remove();
    }
    hideElement();
  }
  
  function getSoftwareData(next) {
    console.log("Calling generate-id API");
    console.log("Sending payload: " + JSON.stringify(getMetadata()));
    GM_xmlhttpRequest({
      method: "POST",
      url: url,
      data: JSON.stringify(getMetadata()),
      headers: {
        "Content-Type": "application/json; charset=UTF-8"
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
  
  function populateData(error, resp) {
    console.log("Received response: ");
    console.log(JSON.parse(resp));
    if (!error && resp) {
      softwareId = JSON.parse(resp).data.softwareKey;
      console.log("Have software ID: " + softwareId);
	  
	  var newUrl = softwareId.replace(softwareId, data.hrefLocation);
	  console.log("CDA url determined as: " + newUrl);
	  CDAElement.setAttribute("href", newUrl); 
	  
	  // Only show if this software exists
    verifySoftwareExists(softwareId, showElement, hideElement);
	  
    } else if (error) {
      console.log(error);
      hideElement();
    }
    
  }
  
  function verifySoftwareExists(softwareId, success, error) {
	  	  
    GM_xmlhttpRequest({
      method: "GET",
      url: verifyUrl + softwareId,
      onload: function(response) {
		    console.log(response.status);
        if (response.status == 404) {
          error();
        } else {
          var resp = JSON.parse(response.responseText);
          if (resp.data.enabled) {
            success();
          } else {
            error();
          }
		}
      },
      onerror: function(response) {
        error();
      }
    });
	  
  }
  
  function main() {
    console.log("Loading script...");
    console.log("Creating elements...");
    createElement();
    console.log("Fetching CDA url...");
    getSoftwareData(populateData);
  }

  if (document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
  
})();
