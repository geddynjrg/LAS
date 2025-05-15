"use server";

import type { ValidFile } from "@workspace/ui/lib/zod";

import { Person, personsStore, type ValidationStatus } from "../data/person";

// Get all persons
export async function getAllPersons(): Promise<Person[]> {
  return personsStore
    .map((person) => populatePerson(person))
    .filter((p): p is Person => p !== undefined);
}

function populatePerson(person: Person | undefined): Person | undefined {
  if (!person) return undefined;

  return {
    ...person,
    informant: person.informant
      ? populatePerson(personsStore.find((p) => p.id === person.informant))
      : undefined,
    mother: person.mother
      ? populatePerson(personsStore.find((p) => p.id === person.mother))
      : undefined,
    father: person.father
      ? populatePerson(personsStore.find((p) => p.id === person.father))
      : undefined,
    spouse: person.spouse
      ? (() => {
          const spouse = personsStore.find((p) => p.id === person.spouse);
          return spouse
            ? {
                id: spouse.id,
                firstName: spouse.firstName,
                lastName: spouse.lastName,
                middleName: spouse.middleName,
                dob: spouse.dob,
                sex: spouse.sex,
                validationStatus: spouse.validationStatus,
                natureOfBirth: spouse.natureOfBirth,
              }
            : undefined;
        })()
      : undefined,
    siblings: person.siblings
      ? person.siblings
          .map((siblingId) => personsStore.find((p) => p.id === siblingId))
          .filter((sibling): sibling is Person => sibling !== undefined)
          .map(
            ({
              id,
              firstName,
              lastName,
              middleName,
              dob,
              sex,
              validationStatus,
              natureOfBirth,
            }) => ({
              id,
              firstName,
              lastName,
              middleName,
              dob,
              sex,
              validationStatus,
              natureOfBirth,
            }),
          )
      : undefined,
    children: person.children
      ? person.children
          .map((childId) => personsStore.find((p) => p.id === childId))
          .filter((child): child is Person => child !== undefined)
          .map(
            ({
              abandoned,
              id,
              firstName,
              lastName,
              middleName,
              dob,
              sex,
              validationStatus,
              natureOfBirth,
            }) => ({
              abandoned,
              id,
              firstName,
              lastName,
              middleName,
              dob,
              sex,
              validationStatus,
              natureOfBirth,
            }),
          )
      : undefined,
  };
}

// Get person by ID
export async function findPersonById(id: string): Promise<Person | undefined> {
  const person = personsStore.find((p) => p.id === id);

  return populatePerson(person);
}

export async function findFemaleWithChildren(): Promise<Person[]> {
  // console.log(personsStore);
  // return personsStore.filter((p) => p.sex === "F" && Array.isArray(p.children));

  const results: Person[] = [];

  for (const p of personsStore) {
    // const personToCheck = p;

    if (p.abandoned && p.informant) {
      const informantPerson = await findPersonById(p.informant as string);
      if (informantPerson) {
        results.push(informantPerson);
      } else {
        continue;
      }
    } else if (p.sex === "F" && Array.isArray(p.children)) {
      results.push(p);
    }
  }

  return results;
}

// Create a new person
export async function createPerson(person: Person): Promise<Person> {
  personsStore.push(person);
  return Promise.resolve(person);
}

// Update a person by ID
export async function updatePerson(
  id: string,
  updatedData: Partial<Person>,
): Promise<Person | null> {
  const index = personsStore.findIndex((p) => p.id === id);
  if (index === -1) return null;

  if (personsStore[index]) {
    const person = personsStore[index];

    if (person.father) {
      const father = personsStore.find((p) => p.id === person.father);
      if (father && updatedData.father) {
        father.firstName =
          typeof updatedData.father === "string" ? updatedData.father : "";
        delete updatedData.father;
      }
    }

    if (person.mother) {
      const mother = personsStore.find((p) => p.id === person.mother);
      if (mother && updatedData.mother) {
        mother.firstName =
          typeof updatedData.mother === "string" ? updatedData.mother : "";

        delete updatedData.mother;
      }
    }

    for (const key in updatedData) {
      const value = updatedData[key as keyof Person];

      // convert file to object
      if (value instanceof File) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updatedData[key as keyof Person] = saveFile(value) as any;
      }
    }

    personsStore[index] = { ...personsStore[index], ...updatedData };

    return personsStore[index];
  } else {
    return null;
  }
}

// Delete a person by ID
export async function deletePerson(id: string): Promise<boolean> {
  const index = personsStore.findIndex((p) => p.id === id);
  if (index === -1) return false;

  personsStore.splice(index, 1);
  return true;
}

export async function updatePersonStatus(
  id: string,
  validationStatus: ValidationStatus,
): Promise<Person | null> {
  const index = personsStore.findIndex((p) => p.id === id);
  if (index === -1) return null;

  if (personsStore[index]) {
    personsStore[index] = { ...personsStore[index], validationStatus };

    return personsStore[index];
  } else {
    return null;
  }
}

function saveFile(file: File) {
  // TODO: if we want to store real files, we need to upload them to a server
  const fileObject: ValidFile = {
    fid: Date.now() + Math.random(),
    filename: file.name,
    url: URL.createObjectURL(file),
  };

  return fileObject;
}
