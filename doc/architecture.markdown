# Architectural Overview

## Object Database

Crypton is an object database.  Many people are already familiar with object
databases, such as ZODB.  Crypton is designed to be a smiliar concept, while
making zero-knowledge privacy guarantees, and also providing a means to
selectively share and collaborate with other users.

Traditional object databases are necessarily tied to the language they are
implemented in.  Crypton attempts to abstract the concept of an object by
storing data in [JSON][] format, which means there is probably already a way
to use it in your development environment of choice.

## Containers

In Crypton, objects are stored in [containers][].  A container is the "root"
object for a given portion of the object database.  Containers are identified
by keys, which are strings, and are unreadable by the server.  When the
application retrieves a container from the server, it requests the container by
a hash of the key.  If you have a large data set, partitioning the data across
containers and lazily loading them as you need them can help keep your
application responsive.

Modifying containers is accomplished using transactions to maintain
consistency.  You can modify multiple containers within a transaction, so
objects in one container may refer to objects in another.

Containers have their own crypto contexts, so sharing a container with another
user amounts to sharing the crypto keys for that container with the other user.
Since the historical state of a container is stored on the server (until
explicitly purged), sharing the current state of a container means that the
user with whom it was shared will also have access to the complete historical
record of changes to that container.  To unshare a container with a specific
user, Crypton will generate a new crypto context for the container, and refrain
from sharing the new keys with that user.

## Messages

Crypton also enables zero-knowledge real-time communication using message
passing.  A message is a small packet of data that is shared with one or more
users and delivered to their respective "inboxes".  [Messages][] are immutable
-- they are only ever created, delivered, retrieved, and deleted.  Message
headers and payload are encryped such that only the recipient can read them.

To send larger amounts of data, a common pattern is to create a container
consisting of the data to send, sharing the container with the intended
recipient, then sending the recipient a message containing a link to that
container.  Using this pattern, collaborative applications can be built by
storing the application data in shared containers, and sending messages back
and forth to notify other users of changes.

## Sessions

The client entry-point into Crypton is through [sessions][].  When a user
authenticates with the server, a session object is created.  Containers are
created and retrieved, and message inboxes are accessed by calling methods on
the session object.  A session can be saved and restored on the client side, to
avoid having to reauthenticate for every request.  The server may invalidate a
session if, for example, the account password changes, the account was deleted,
or disabled for non-payment, so sessions also have a `ping()` method to
determine continued validity.

## Encryption

Crypton uses multiple crypto contexts to enable data storage, retrieval, and
sharing while ensuring that the user has complete control over what data is
readable and by whom.  At the highest level, a Crypton account is protected by
a key derived from the user's password, which is never stored persistently.
This outer-level key is used to encrypt a second-level symmetric key, which is
then used to encrypt keys for other contexts, and so on.  This separation
allows a user to change his password without having to re-encrypt all
historical data (although it also implies that if an account's password is
compromised, an attacker will always be able to read any data encrypted with
those keys, even after the user changes his password.  This is judged an
acceptable tradeoff given the axiom from information theory that once a piece
of information is released, it can never be revoked.)

### Account Data

When an account is created, Crypton generates the following pieces of data:

* `symkey`: 32 random bytes, used as symmetric key for encrypting other keys.
* `hmac_key`: 32 random bytes, HMAC key used for general data authentication.
* `hmac_key_iv`: 16 random bytes, used with `symkey` to encrypt `hmac_key`.
* `hmac_key_ciphertext`: 32 bytes, output of
  `AES(symkey, hmac_key_iv).encrypt(hmac_key)`.
* `container_name_hmac_key`: 32 random bytes, HMAC key used to hash container
  names.
* `container_name_hmac_key_iv`: 16 random bytes, used with `symkey` to encrypt
  `container_name_hmac_key`.
* `container_name_hmac_key_ciphertext`: 32 bytes, output of
  `AES(symkey, container_name_hmac_key_iv).encrypt(container_name_hmac_key)`.
* `keypair`: an ECC keypair object.
* `pubkey`: the public component of `keypair`.
* `keypair_key_salt`: 32 random bytes, salt used by KDF when generating
  `keypair_key`.
* `keypair_key`: output of `KDF(keypair_key_salt, passphrase)`, used to encrypt
  `keypair`.  Never known by server.
* `keypair_iv`: 16 random bytes, used with `keypair_key` to encrypt `keypair`.
* `keypair_ciphertext`: many bytes, output of
  `AES(keypair_key, keypair_iv).encrypt(keypair)`.
* `symkey_ciphertext`: many bytes, output of `keypair.encrypt(symkey)`.

In order to enable a client to retrieve and decrypt the various keys when all
it knows is the password, some of the above values are stored on the server in
their encrypted forms.  Once the client authenticates to the server, the server
will send the encrypted values to the client, which can then compute the other
values by re-generating `keypair_key` using the user's passphrase.  The
following items are stored on the server and sent to the client after
authentication:

* `hmac_key_iv`
* `hmac_key_ciphertext`
* `container_name_hmac_key_iv`
* `container_name_hmac_key_ciphertext`
* `pubkey`
* `keypair_key_salt`
* `keypair_iv`
* `keypair_ciphertext`
* `symkey_ciphertext`


[json]: http://json.org
[containers]: https://crypton.io/docs/containers
[messages]: https://crypton.io/docs/messages
[sessions]: https://crypton.io/docs/sessions
