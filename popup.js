document.addEventListener('DOMContentLoaded', function () {
  const actionButton = document.getElementById('actionButton');
  const description = document.getElementById('description');
  
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let tab = tabs[0];


    // Regex to detect a standard YouTube video URL with optional time parameter
    const youtubeVideoRegex = /^https:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(&t=\d+[sm]?)?$/;
    // Regex to detect a YouTube embed URL with optional time parameter
    const youtubeEmbedRegex = /^https:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)(\?start=\d+)?$/;

    if (youtubeVideoRegex.test(tab.url)) {
      // If it's a standard YouTube video, show "Redirect to Embed" button
      actionButton.textContent = "Redirect to Embed";
      description.textContent = "Click to view the video in embed mode.";

      actionButton.addEventListener('click', function () {
        actionButton.disabled = true;
        actionButton.textContent = "Redirecting...";

        // Execute script to get the current video playback time from the YouTube player
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            function: getCurrentTimeFromVideo
          },
          (results) => {
            let videoId = youtubeVideoRegex.exec(tab.url)[2];
            let embedUrl = `https://www.youtube.com/embed/${videoId}`;
            let timeParam = results[0].result;

            // If time was retrieved from the video, append it to the embed URL
            if (timeParam) {
              embedUrl += `?start=${Math.floor(timeParam)}`;
            }

            chrome.tabs.update(tab.id, { url: embedUrl }, () => {
              actionButton.textContent = "Revert to Standard URL";
              actionButton.disabled = false;
              description.textContent = "You are now viewing the video in embed mode.";
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  function: () => chrome.runtime.reload()
                }
              );
            });
          }
        );
      });

    } else if (youtubeEmbedRegex.test(tab.url)) {
      // If it's an embed URL, show "Revert to Standard URL" button
      actionButton.textContent = "Revert to Standard URL";
      description.textContent = "Click to view the video in standard mode.";

      actionButton.addEventListener('click', function () {
        actionButton.disabled = true;
        actionButton.textContent = "Redirecting...";

        // Execute script to get the current video playback time from the embed YouTube player
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id },
            function: getCurrentTimeFromVideo
          },
          (results) => {
            let videoId = youtubeEmbedRegex.exec(tab.url)[2];
            let standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
            let timeParam = results[0].result;

            // If time was retrieved from the video, append it to the standard URL
            if (timeParam) {
              standardUrl += `&t=${Math.floor(timeParam)}s`;
            }

            chrome.tabs.update(tab.id, { url: standardUrl }, () => {
              actionButton.textContent = "Redirect to Embed";
              actionButton.disabled = false;
              description.textContent = "You are now viewing the video in standard mode.";
              chrome.scripting.executeScript(
                {
                  target: { tabId: tab.id },
                  function: () => chrome.runtime.reload()
                }
              );
            });
          }
        );
      });

    } else {
      // If it's not a YouTube video or embed page, disable the button
      actionButton.textContent = "Not a YouTube Video";
      actionButton.disabled = true;
      description.textContent = "This extension only works on YouTube video pages.";
    }
  });
});

// This function is injected into the YouTube tab (standard or embed) to get the current playback time
function getCurrentTimeFromVideo() {
  const videoElement = document.querySelector('video');
  if (videoElement) {
    return videoElement.currentTime;
  }
  return 0;
}
