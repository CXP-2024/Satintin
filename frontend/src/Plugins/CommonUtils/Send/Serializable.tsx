export abstract class Message {}

export abstract class Serializable extends Message {
    public readonly type = this.getName()

    private getName() {
        return this.constructor.name
    }
}
