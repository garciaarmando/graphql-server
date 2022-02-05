import { ApolloServer, UserInputError, gql } from "apollo-server";
import { v1 as uuid } from "uuid";
import axios from "axios";

const persons = [{
        name: "Chipo",
        phone: "5559478257",
        street: "Av. Pablo Neruda",
        city: "Guadalajara",
        id: "2f0e9995-6ef1-4b12-a262-4880cf00dd99",
    },

    {
        name: "Fili",
        phone: "3339102389",
        street: "Bahamas",
        city: "Guadalajara",
        id: "1107727d-0b86-477c-90c8-2c26ce4da0e6",
    },

    {
        name: "Minus",
        street: "Carril",
        city: "México",
        id: "180759245-eb1a-47eb-98e3-7b6c73c15ac6",
    },
];

const typeDefs = gql `
  enum YesNo {
    YES
    NO
  }

  enum NoteState {
    COMPLETED
    PROGRESS
  }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
  }
`;

const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async(root, args) => {
            const { data: personsFromRestApi } = await axios.get(
                "http://localhost:3000/persons"
            );

            console.log(personsFromRestApi);

            if (!args.phone) return personsFromRestApi;

            const byPhone = person =>
                args.phone === "YES" ? person.phone : !person.phone;

            return persons.filter(byPhone);
        },

        findPerson: (root, args) => {
            const { name } = args;
            return persons.find(person => person.name === name);
        },
    },

    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name === args.name)) {
                throw new UserInputError("Name must be unique", {
                    invalidArgs: args.name,
                });
            }
            // const { name, phone, street, city } = args;
            const person = {...args, id: uuid() };
            persons.push(person);
            return person;
        },
    },

    Person: {
        address: root => {
            return {
                street: root.street,
                city: root.city,
            };
        },
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
});

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
});