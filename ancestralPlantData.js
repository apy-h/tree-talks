export const treeData = {
  name: "Origin of Life",
  description: "Common ancestor of all life",
  traits: [],
  children: [
    {
      name: "Bacteria",
      description: "",
      traits: [],
      children: []
    },
    {
      name: "",
      description: "",
      traits: [],
      children: [
        {
          name: "Archaea",
          description: "",
          traits: [],
          children: []
        },
        {
          name: "Eukaryotes",
          description: "",
          traits: [],
          children: [
            {
              name: "Animals",
              description: "",
              traits: ["Diplontic Life Cycle"],
              children: []
            },
            {
              name: "Plants",
              description: "",
              traits: ["Haplontic Life Cycle"],
              children: [
                {
                  name: "Other",
                  description: "",
                  traits: [],
                  children: []
                },
                {
                  name: "Archaeplastids",
                  description: "",
                  traits: [],
                  children: [
                    {
                      name: "Glaucocystophytes",
                      description: "",
                      traits: [],
                      children: []
                    },
                    {
                      name: "",
                      description: "",
                      traits: [],
                      children: [
                        {
                          name: "Red Algae",
                          description: "",
                          traits: ["Complex Multicellularity"],
                          children: []
                        },
                        {
                          name: "Viridoplantae",
                          description: "",
                          traits: [],
                          children: [
                            {
                              name: "Chlorophytes",
                              description: "",
                              traits: [],
                              children: []
                            },
                            {
                              name: "",
                              description: "",
                              traits: ["Sporopollenin in Zygote Wall"],
                              children: [
                                {
                                  name: "Chara & Nitella",
                                  description: "",
                                  traits: [],
                                  children: []
                                },
                                {
                                  name: "",
                                  description: "",
                                  traits: [],
                                  children: [
                                    {
                                      name: "Coleochaete",
                                      description: "",
                                      traits: [],
                                      children: []
                                    },
                                    {
                                      name: "",
                                      description: "",
                                      traits: [],
                                      children: [
                                        {
                                          name: "Zygnemetales",
                                          description: "",
                                          traits: [],
                                          children: []
                                        },
                                        {
                                          name: "Land Plants",
                                          description: "Embryophytes",
                                          traits: ["Complex Multicellularity"],
                                          children: []
                                        }
                                      ]
                                    }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  polyphyleticGroups: [
    {
      name: "Prokaryotes",
      members: ["Bacteria", "Archaea"]
    },
    {
      name: "Green Algae",
      members: ["Chlorophytes", "Chara & Nitella", "Coleochaete", "Zygnemetales"]
    },
    {
      name: "Streptophytes",
      members: ["Chara & Nitella", "Coleochaete", "Zygnemetales"]
    }
  ]
};