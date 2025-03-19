"use server";

import { nationalIdPeopleOptions } from "@/lib/data/dummy-data";
import { createPerson } from "@/lib/services/person-service";
// birthRegistrationStore
import {
  birthRegistrationStore,
  Person,
  resetBirthRegistrationStore,
  type BirthRegistrationStore,
  type SexType,
  type ValidationStatus,
} from "../data/person";

export type BirthRegistrationQuery =
  | "child"
  | "mother"
  | "father"
  | "informant";

export async function getFormPerson<T extends keyof BirthRegistrationStore>(
  type: T,
): Promise<BirthRegistrationStore[T] | undefined> {
  return birthRegistrationStore[type];
}

export async function createNewPerson(
  type: BirthRegistrationQuery,
  person: Partial<Person>,
): Promise<Person> {
  birthRegistrationStore[type] = person;
  return person;
}

export async function searchPerson(query: string): Promise<Partial<Person>[]> {
  const words = query.toLowerCase().split(/\s+/);

  return nationalIdPeopleOptions.filter((p) =>
    words.every(
      (word) =>
        (p.nationalId && p.nationalId.includes(word)) ||
        (p.firstName && p.firstName.toLowerCase().includes(word)) ||
        (p.lastName && p.lastName.toLowerCase().includes(word)) ||
        (p.middleName && p.middleName.toLowerCase().includes(word)),
    ),
  );
}

export async function searchPersonBySex(
  query: string,
  sex: SexType,
): Promise<Partial<Person>[]> {
  const words = query.toLowerCase().split(/\s+/);

  return nationalIdPeopleOptions
    .filter((p) => p.sex === sex)
    .filter((p) =>
      words.every(
        (word) =>
          (p.nationalId && p.nationalId.includes(word)) ||
          (p.firstName && p.firstName.toLowerCase().includes(word)) ||
          (p.lastName && p.lastName.toLowerCase().includes(word)) ||
          (p.middleName && p.middleName.toLowerCase().includes(word)),
      ),
    );
}

export async function saveForm() {
  const child = await getFormPerson("child");
  const mother = await getFormPerson("mother");
  const father = await getFormPerson("father");
  const informant = await getFormPerson("informant");

  const childValues = Array.isArray(child) ? child[0] : (child ?? null);

  if (!childValues) return null;

  childValues.lastName = mother?.lastName ?? "";
  childValues.mother = mother?.id ?? "";
  childValues.father = father?.id ?? "";
  childValues.informant = informant?.id ?? "";
  childValues.validationStatus = "alert";

  if (mother) {
    mother.children = mother.children ?? [];
    mother.children.push(childValues.id ?? "");
    createPerson(mother);
  }

  if (father) {
    father.children = father.children ?? [];
    father.children.push(childValues.id ?? "");
    createPerson(father);
  }

  createPerson(childValues);
  if (informant) {
    createPerson(informant);
  }

  resetBirthRegistrationStore();
}
