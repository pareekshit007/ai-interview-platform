export const stopMediaStream = (stream) => {
  if (!stream) return;

  stream.getTracks().forEach(track => {
    track.stop();
  });
};
