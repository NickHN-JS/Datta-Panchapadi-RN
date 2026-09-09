import { sampurnaPanchapadiBook } from './sampurna-panchapadi';
import { karunatripadiBook } from './karunatripadi';
import { guruvarchiBook } from './guruvarchi';
import { kshetraParichayBook } from './kshetra-parichay';
import type { Book } from '../types/book';

export const libraryBooks: Book[] = [
    karunatripadiBook,
    guruvarchiBook,
    {
        ...sampurnaPanchapadiBook,
        id: "sampurna",
        metadata: {
            ...sampurnaPanchapadiBook.metadata,
            title: "संपूर्ण पंचपदी",
            description: "१४४+ आरत्या, भूपाळ्या आणि भजने यांचा संपूर्ण संग्रह."
        }
    },
    kshetraParichayBook
];
