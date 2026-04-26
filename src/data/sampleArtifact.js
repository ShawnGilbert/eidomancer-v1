// D:\eidomancer\src\data\sampleArtifact.js

export const sampleArtifact = {
  id: "artifact-demo-001",
  title: "The Witness Under Pressure",
  subtitle: "A symbolic interface for compressed meaning",
  createdAt: new Date().toISOString(),

  privacy: {
    inputVisible: true,
    censored: false,
  },

  input: {
    type: "question",
    text: "Why does this feel like pressure turning into clarity?",
  },

  coreImageUrl: "",

  cast: {
    signal:
      "A subtle pressure is becoming visible. What once felt like background noise is starting to organize itself into a recognizable pattern.",

    tension:
      "The system wants release, but the mind keeps compressing the signal. Too much force turns insight into distortion.",

    pattern:
      "Repeated loops create the illusion of movement while returning to the same emotional center.",

    insight:
      "Clarity does not arrive by crushing the question harder. It emerges when the structure of the pressure is finally seen.",

    essence:
      "Pressure is not always failure. Sometimes it is meaning asking for a shape.",
  },

  structure: {
    coreObject: "A cracked symbolic instrument glowing from within",
    mood: "Contained pressure resolving into awareness",
    palette: ["ember", "violet", "deep black"],
    symbols: ["fracture", "loop", "signal", "release"],
  },
};