"use server";

import { revalidatePath } from "next/cache";

import { generateUUID, nationalIdPeopleOptions } from "@/lib/data/dummy-data";
import { createPerson } from "@/lib/services/person-service";
import {
  birthRegistrationStore,
  Person,
  resetBirthRegistrationStore,
  type BirthRegistrationStore,
  type SexType,
} from "../data/person";

export type BirthRegistrationQuery =
  | "child"
  | "mother"
  | "father"
  | "informant";

export async function getFormPerson<T extends keyof BirthRegistrationStore>(
  type: T,
) {
  return birthRegistrationStore[type];
}

export async function editPerson(
  type: BirthRegistrationQuery,
  person?: Person,
): Promise<Person | undefined> {
  if (!person) {
    if (type === "child") {
      birthRegistrationStore[type] = [] as Person[];
    } else {
      birthRegistrationStore[type] = {} as Person;
    }
  } else {
    if (type === "child") {
      const childArray = birthRegistrationStore[type];

      const existingIndex = childArray.findIndex((p) => p.id === person.id);

      if (existingIndex !== -1) {
        childArray[existingIndex] = {
          ...childArray[existingIndex],
          ...person,
        };
      } else {
        birthRegistrationStore[type] = [
          ...childArray,
          {
            ...person,
            id: generateUUID(),
          },
        ];
      }
    } else {
      if (!person.id) {
        person.id = generateUUID();
      }

      birthRegistrationStore[type] = {
        ...birthRegistrationStore[type],
        ...person,
      };
    }
  }

  return person;
}

export async function resetFormReset() {
  await resetBirthRegistrationStore();
}

export async function searchPerson(query: string, sex?: SexType) {
  const words = query.toLowerCase().split(/\s+/);

  return nationalIdPeopleOptions
    .filter((p) => (sex ? p.sex === sex : true))
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
  const children = await getFormPerson("child");
  const mother = await getFormPerson("mother");
  const father = await getFormPerson("father");
  const informant = await getFormPerson("informant");

  if (!children || !Array.isArray(children) || children.length === 0)
    return null;

  for (const child of children) {
    child.lastName = mother?.lastName ?? "";
    child.mother = mother?.id ?? "";
    child.father = father?.id ?? "";
    child.informant = informant?.id ?? "";
    child.placeOfBirth = child.healthInstitution ?? "";
    child.validationStatus = "alert";

    await createPerson(child);
  }

  if (mother && !children[0]?.abandoned) {
    mother.sex = "F";
    mother.children = mother.children ?? [];

    mother.children = mother.children ?? [];
    for (const child of children) {
      (mother.children as string[]).push(child.id ?? "");
    }
    await createPerson(mother);
  }

  if (father && !children[0]?.abandoned) {
    father.sex = "M";
    father.children = father.children ?? [];
    for (const child of children) {
      (father.children as string[]).push(child.id ?? "");
    }
    await createPerson(father);
  }
  if (informant) {
    informant.children = informant.children ?? [];
    for (const child of children) {
      (informant.children as string[]).push(child.id ?? "");
    }
    await createPerson(informant);
  }

  await resetBirthRegistrationStore();

  revalidatePath("/");
}
