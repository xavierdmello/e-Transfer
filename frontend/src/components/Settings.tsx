import { Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useBalance, useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits, formatEther, zeroAddress } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import eTransferAbi from "../../../abi/eTransferAbi";
import tokenAbi from "../../../abi/tokenAbi";
import { nanoid } from "nanoid";
import db from "../firebase.ts";
import { ref, update, set, onValue, get } from "firebase/database";
import { hashEmail, toFixedIfNecessary, numberWithCommas } from "../helperFunctions.ts";
import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  UnorderedList,
  Divider,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
  Text,
  Spacer,
  Switch,
  Breadcrumb,
} from "@chakra-ui/react";
import { getRedirectResult } from "firebase/auth";
import { isCastable } from "../helperFunctions.ts";
import { ETRANSFER_ADDRESS, TOKEN_ADDRESS } from "../../../config";

type TransferWithId = {
  from: `0x${string}`;
  to: `0x${string}`;
  refundAddress: `0x${string}`;
  amount: bigint;
  id: string;
  index: bigint;
};

type Contact = {
  email: string;
  name: string;
};

function Settings() {
  const toast = useToast();
  const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi();
  const { wallets } = useWallets();
  const { user } = usePrivy();
  const { isOpen: isAutodepositModalOpen, onOpen: onAutodepositModalOpen, onClose: onAutodepositModalClose } = useDisclosure();
  const prevAutodepositSwitchOnRef = useRef(false);

  const [autodepositAddressInput, setAutodepositAddressInput] = useState("None Selected");
  const [autodepositSwitchOn, setAutodepositSwitchOn] = useState(false);
  const [turnAutodepositOffFlag, setTurnAutodepositOffFlag] = useState(false);

  const { data: autodepositAddress, isLoading: isAutodepositAddressLoading } = useContractRead({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "autodepositAddress",
    args: [hashEmail(user?.email?.address!)],
    enabled: typeof activeWallet !== "undefined",
    watch: true,
  });

  function handleSetAutodeposit() {
    if (autodepositAddressInput === "None Selected") {
      setAutodeposit({ args: [zeroAddress] });
    } else {
      setAutodeposit({ args: [autodepositAddressInput as `0x${string}`] });
    }
  }

  // Reflect autodeposit blockchain state
  useEffect(() => {
    if (autodepositAddress !== undefined && autodepositAddress !== null && autodepositAddress !== zeroAddress) {
      setAutodepositAddressInput(autodepositAddress);
      setAutodepositSwitchOn(true);
    } else {
      setAutodepositAddressInput("None Selected");
      setAutodepositSwitchOn(false);
    }
  }, [autodepositAddress]);

  // If the user turns autodeposit on (from off), open the modal to select the wallet to deposit to
  useEffect(() => {
    if (autodepositSwitchOn === true) {
      if (autodepositAddress === undefined || autodepositAddress === null || autodepositAddress === zeroAddress) {
        onAutodepositModalOpen();
      }
    }
  }, [autodepositSwitchOn, autodepositAddress]);

  // If the user turns autodeposit off (from on), disable autodeposit
  useEffect(() => {
    if (prevAutodepositSwitchOnRef.current === true && autodepositSwitchOn === false) {
      if (autodepositAddress !== undefined && autodepositAddress !== null && autodepositAddress !== zeroAddress) {
        setAutodepositAddressInput("None Selected");
        setTurnAutodepositOffFlag(true);
      }
    }
    prevAutodepositSwitchOnRef.current = autodepositSwitchOn;
  }, [autodepositSwitchOn, autodepositAddress]);
  useEffect(() => {
    if (autodepositAddress !== undefined && autodepositAddress !== null && autodepositAddress !== zeroAddress) {
      if (turnAutodepositOffFlag === true) {
        setTurnAutodepositOffFlag(false);
        handleSetAutodeposit();
      }
    }
  }, [turnAutodepositOffFlag, autodepositAddress]);

  const {
    write: setAutodeposit,
    data: setAutodepositData,
    isLoading: isSetAutodepoitLoading,
  } = useContractWrite({
    address: ETRANSFER_ADDRESS,
    abi: eTransferAbi,
    functionName: "setAutodepositAddress",
  });
  const { isLoading: isSetAutodepoitWaitingForConf } = useWaitForTransaction({
    hash: setAutodepositData?.hash,
    onSuccess(data) {
      onAutodepositModalClose();
      toast({
        title: "Transaction success.",
        status: "success",
        isClosable: true,
        duration: 6000,
      });
    },
    onError(error) {
      toast({
        title: "Transaction error.",
        description: error.message,
        status: "error",
        isClosable: true,
        duration: 6000,
      });
    },
  });

  return (
    <Box backgroundColor={"white"} height={"100%"} borderRadius={"3xl"} overflow={"auto"} padding={"16px"}>
      <Modal isOpen={isAutodepositModalOpen} onClose={onAutodepositModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enable Autodeposit</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={"16px"}>Choose the wallet you want to automatically deposit incoming e-Transfers to:</Text>

            <Select
              value={autodepositAddressInput}
              onChange={(e) => {
                setAutodepositAddressInput(e.target.value);
              }}
              defaultValue={"e-Transfer® wallet"}
            >
              {[
                <option key="None Selected" value="None Selected">
                  None Selected
                </option>,
                ...wallets.map((wallet) => {
                  if (user?.wallet?.address === wallet.address) {
                    return (
                      <option key={wallet.address} value={wallet.address}>
                        e-Transfer® wallet
                      </option>
                    );
                  } else {
                    return (
                      <option key={wallet.address} value={wallet.address}>
                        {wallet.address}
                      </option>
                    );
                  }
                }),
              ]}
            </Select>
          </ModalBody>

          <ModalFooter>
            <Button isLoading={isSetAutodepoitLoading || isSetAutodepoitWaitingForConf} colorScheme="brand" textColor={"black"} onClick={handleSetAutodeposit}>
              Enable Autodeposit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Flex direction={"column"} gap={"8px"}>
        <Center>
          <Text fontSize={"16px"} fontWeight={"semibold"}>
            e-Transfer® Settings
          </Text>
        </Center>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex flexDirection={"column"}>
          <Flex flexDirection={"row"} alignItems={"center"} justifyContent={"space-between"}>
            <Flex flexDirection={"column"} mr="8px">
              <Text fontWeight={"medium"} fontSize={"lg"}>
                Autodeposit
              </Text>

              <Text fontSize={"sm"} textColor={"gray.500"}>
                Automatically deposit incoming e-Transfers to your wallet
              </Text>
            </Flex>

            <Switch size="lg" isChecked={autodepositSwitchOn} onChange={() => setAutodepositSwitchOn(!autodepositSwitchOn)}></Switch>
          </Flex>
        </Flex>

        <Flex
          direction={"row"}
          alignItems={"center"}
          gap={"12px"}
          mt={"10px"}
          display={autodepositAddress === zeroAddress || autodepositAddress === null || autodepositAddress === undefined ? "none" : "block"}
        >
          <Text whiteSpace={"nowrap"} fontSize={"sm"} fontWeight={"medium"}>
            Deposit To:
          </Text>
          <Select
            value={autodepositAddressInput}
            onChange={(e) => {
              setAutodepositAddressInput(e.target.value);
              handleSetAutodeposit();
            }}
          >
            {wallets.map((wallet) => {
              if (user?.wallet?.address === wallet.address) {
                return (
                  <option key={wallet.address} value={wallet.address}>
                    e-Transfer® wallet
                  </option>
                );
              } else {
                return (
                  <option key={wallet.address} value={wallet.address}>
                    {wallet.address}
                  </option>
                );
              }
            })}
          </Select>
        </Flex>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />

        <Flex direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
          <Flex direction={"column"}>
            <Text fontWeight={"medium"} fontSize={"lg"}>
              Nickname
            </Text>
            <Text fontSize={"sm"} textColor={"gray.500"}>
              Displayed on outgoing transfers
            </Text>
          </Flex>

          <Input width={"50%"} placeholder="John Doe" />
        </Flex>

        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" my="8px" />
      </Flex>
    </Box>
  );
}

export default Settings;
