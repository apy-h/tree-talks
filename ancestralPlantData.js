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
          traits: ["Mitochondria"],
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
              traits: [],
              children: []
            },
            {
              name: "Plants",
              description: "",
              traits: [],
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
                          traits: [],
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
                              traits: [],
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
                                          traits: [],
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
      name: "Green Algae",
      members: ["Chlorophytes", "Chara & Nitella", "Coleochaete", "Zygnemetales"]
    },
    {
      name: "Streptophytes",
      members: ["Chara & Nitella", "Coleochaete", "Zygnemetales"]
    }
  ]
};