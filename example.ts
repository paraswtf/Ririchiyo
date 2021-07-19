class Encapsulation {
    private value: string;
    private value2: string;
    private value3: string;
    private value4: string;

    constructor() {
        this.value = "something";
    }

    public setValue(value: string) {
        this.value = value;
    }
    public setValue2(value: string) {
        this.value2 = value;
    }
    public setValue3(value: string) {
        this.value3 = value;
    }
    public setValue4(value: string) {
        this.value4 = value;
    }

    public getValue() {
        return this.value;
    }
    public getValue2() {
        return this.value2;
    }
    public getValue3() {
        return this.value3;
    }
    public getValue4() {
        return this.value4;
    }
}

const test = new Encapsulation();
test.setValue("tsesadasdsa");

export class PolymorphismAnimal {
    k = "sadasdasdasd";
    constructor() { }

    voice() {
        return "~~~";
    }
}

export class Cat extends PolymorphismAnimal {
    constructor() {
        super();
    }

    y = super.k;

    voice() {
        return "meow";
    }
}

export class Dog extends PolymorphismAnimal {
    voice() {
        return "bark";
    }
}

const cat = new Cat();
cat.voice();
cat.y;
