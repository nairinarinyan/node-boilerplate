async function* genSequence<T1, T2>(list: T1[], map: (item: T1, idx?: number) => Promise<T2>) {
    for (const [idx, item] of list.entries()) {
        yield await map(item, idx);
    }
}

export const sequence = async <T1, T2>(list: T1[], map: (item: T1, idx?: number) => Promise<T2>): Promise<T2[]> => {
    const results = [];

    for await (const result of genSequence(list, map)) {
        results.push(result);
    }

    return results;
}